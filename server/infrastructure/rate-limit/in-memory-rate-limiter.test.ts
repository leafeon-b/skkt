import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createInMemoryRateLimiter } from "./in-memory-rate-limiter";
import { TooManyRequestsError } from "@/server/domain/common/errors";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("InMemoryRateLimiter", () => {
  const config = { maxAttempts: 3, windowMs: 60_000 };

  test("制限内ならcheckはスローしない", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");
    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("maxAttempts到達でTooManyRequestsErrorをスロー", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");
    await expect(limiter.check("key")).rejects.toThrow(TooManyRequestsError);
  });

  test("ウィンドウ経過後にカウンターがリセットされる", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");

    vi.advanceTimersByTime(60_000);

    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("resetでカウンターがクリアされる", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");

    await limiter.reset("key");

    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("TooManyRequestsErrorにretryAfterMsが含まれる", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordAttempt("key");

    vi.advanceTimersByTime(5_000); // 5秒経過
    await limiter.recordAttempt("key");
    await limiter.recordAttempt("key");

    try {
      await limiter.check("key");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TooManyRequestsError);
      const e = error as TooManyRequestsError;
      // 最古の試行は55秒後に期限切れ → retryAfterMs ≈ 55_000
      expect(e.retryAfterMs).toBeGreaterThan(0);
      expect(e.retryAfterMs).toBeLessThanOrEqual(config.windowMs);
    }
  });

  test("キーごとに独立してカウントする", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordAttempt("key-a");
    await limiter.recordAttempt("key-a");
    await limiter.recordAttempt("key-a");

    await expect(limiter.check("key-a")).rejects.toThrow(TooManyRequestsError);
    await expect(limiter.check("key-b")).resolves.toBeUndefined();
  });

  test("未記録のキーはcheckをパスする", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await expect(limiter.check("unknown")).resolves.toBeUndefined();
  });
});
