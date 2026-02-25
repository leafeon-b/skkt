import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    $transaction: vi.fn((queries: unknown[]) =>
      Promise.all(queries as Promise<unknown>[]),
    ),
    rateLimitAttempt: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/infrastructure/db";
import { TooManyRequestsError } from "@/server/domain/common/errors";
import { createPrismaRateLimiter } from "./prisma-rate-limiter";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("PrismaRateLimiter", () => {
  const config = { maxAttempts: 3, windowMs: 60_000, category: "test" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("制限内ならcheckはスローしない", async () => {
    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(2);

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("maxAttempts到達でTooManyRequestsErrorをスロー", async () => {
    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(3);
    mockedPrisma.rateLimitAttempt.findFirst.mockResolvedValueOnce({
      attemptedAt: new Date(Date.now() - 10_000),
    } as never);

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.check("key")).rejects.toThrow(TooManyRequestsError);
  });

  test("TooManyRequestsErrorにretryAfterMsが含まれる", async () => {
    const now = Date.now();
    const oldestAttemptedAt = new Date(now - 10_000); // 10秒前

    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(3);
    mockedPrisma.rateLimitAttempt.findFirst.mockResolvedValueOnce({
      attemptedAt: oldestAttemptedAt,
    } as never);

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.check("key")).rejects.toSatisfy(
      (error: TooManyRequestsError) => {
        // retryAfterMs ≈ oldestAttemptedAt + windowMs - now = 50_000
        expect(error.retryAfterMs).toBeGreaterThan(0);
        expect(error.retryAfterMs).toBeLessThanOrEqual(config.windowMs);
        return true;
      },
    );
  });

  test("checkはトランザクション内で実行される", async () => {
    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(0);

    const limiter = createPrismaRateLimiter(config);
    await limiter.check("user-1");

    expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  test("checkはkey, category, windowMsでフィルタする", async () => {
    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(0);

    const limiter = createPrismaRateLimiter(config);
    await limiter.check("user-1");

    expect(mockedPrisma.rateLimitAttempt.count).toHaveBeenCalledWith({
      where: {
        key: "user-1",
        category: "test",
        attemptedAt: { gte: expect.any(Date) },
      },
    });
  });

  test("checkは古いレコードをpruningする", async () => {
    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(0);

    const limiter = createPrismaRateLimiter(config);
    await limiter.check("user-1");

    expect(mockedPrisma.rateLimitAttempt.deleteMany).toHaveBeenCalledWith({
      where: {
        category: "test",
        attemptedAt: { lt: expect.any(Date) },
      },
    });
  });

  test("recordFailureはレコードを作成する", async () => {
    mockedPrisma.rateLimitAttempt.create.mockResolvedValueOnce({} as never);

    const limiter = createPrismaRateLimiter(config);
    await limiter.recordFailure("user-1");

    expect(mockedPrisma.rateLimitAttempt.create).toHaveBeenCalledWith({
      data: {
        key: "user-1",
        category: "test",
      },
    });
  });

  test("resetは該当キー+カテゴリのレコードを削除する", async () => {
    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 3,
    });

    const limiter = createPrismaRateLimiter(config);
    await limiter.reset("user-1");

    expect(mockedPrisma.rateLimitAttempt.deleteMany).toHaveBeenCalledWith({
      where: {
        key: "user-1",
        category: "test",
      },
    });
  });
});
