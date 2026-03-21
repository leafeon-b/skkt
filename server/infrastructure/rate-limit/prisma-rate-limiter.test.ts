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
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(2);

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("maxAttempts到達でTooManyRequestsErrorをスロー", async () => {
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

  test("確率的pruningが発動した場合でもcheckはエラーなく完了する", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.05); // 0.1未満 → pruning発動

    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(0);

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.check("user-1")).resolves.toBeUndefined();

    vi.spyOn(Math, "random").mockRestore();
  });

  test("確率的pruningが発動しない場合でもcheckはエラーなく完了する", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // 0.1以上 → pruningスキップ

    mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(0);

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.check("user-1")).resolves.toBeUndefined();

    vi.spyOn(Math, "random").mockRestore();
  });

  test("recordAttemptはエラーなく完了する", async () => {
    mockedPrisma.rateLimitAttempt.create.mockResolvedValueOnce({} as never);

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.recordAttempt("user-1")).resolves.toBeUndefined();
  });

  test("resetはエラーなく完了する", async () => {
    mockedPrisma.rateLimitAttempt.deleteMany.mockResolvedValueOnce({
      count: 3,
    });

    const limiter = createPrismaRateLimiter(config);
    await expect(limiter.reset("user-1")).resolves.toBeUndefined();
  });

  test("異なるキー間で試行回数は独立している", async () => {
    mockedPrisma.rateLimitAttempt.count
      .mockResolvedValueOnce(3) // key-A: maxAttempts到達
      .mockResolvedValueOnce(0); // key-B: 試行なし

    mockedPrisma.rateLimitAttempt.findFirst.mockResolvedValueOnce({
      attemptedAt: new Date(Date.now() - 10_000),
    } as never);

    const limiter = createPrismaRateLimiter(config);

    await expect(limiter.check("key-A")).rejects.toThrow(TooManyRequestsError);
    await expect(limiter.check("key-B")).resolves.toBeUndefined();
  });

  describe("境界値: maxAttempts前後のcheck", () => {
    test("count === maxAttempts - 1 ならcheckは通る", async () => {
      mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(2); // maxAttempts(3) - 1

      const limiter = createPrismaRateLimiter(config);
      await expect(limiter.check("key")).resolves.toBeUndefined();
    });

    test("count === maxAttempts ならTooManyRequestsErrorをスロー", async () => {
      mockedPrisma.rateLimitAttempt.count.mockResolvedValueOnce(3); // maxAttempts(3)
      mockedPrisma.rateLimitAttempt.findFirst.mockResolvedValueOnce({
        attemptedAt: new Date(Date.now() - 10_000),
      } as never);

      const limiter = createPrismaRateLimiter(config);
      await expect(limiter.check("key")).rejects.toThrow(TooManyRequestsError);
    });
  });

  describe("DBエラー時の振る舞い", () => {
    test("checkはDBエラー時にTooManyRequestsErrorをスローする（fail-closed）", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockedPrisma.rateLimitAttempt.count.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const limiter = createPrismaRateLimiter(config);
      await expect(limiter.check("user-1")).rejects.toThrow(
        TooManyRequestsError,
      );

      vi.mocked(console.error).mockRestore();
    });

    test("recordAttemptはDBエラー時に例外をスローしない（fail-open）", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockedPrisma.rateLimitAttempt.create.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const limiter = createPrismaRateLimiter(config);
      await expect(limiter.recordAttempt("user-1")).resolves.toBeUndefined();

      vi.mocked(console.error).mockRestore();
    });

    test("resetはDBエラー時に例外をスローしない（fail-open）", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockedPrisma.rateLimitAttempt.deleteMany.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const limiter = createPrismaRateLimiter(config);
      await expect(limiter.reset("user-1")).resolves.toBeUndefined();

      vi.mocked(console.error).mockRestore();
    });
  });
});
