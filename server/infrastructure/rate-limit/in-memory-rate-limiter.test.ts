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
    await limiter.recordFailure("key");
    await limiter.recordFailure("key");
    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("maxAttempts到達でTooManyRequestsErrorをスロー", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordFailure("key");
    await limiter.recordFailure("key");
    await limiter.recordFailure("key");
    await expect(limiter.check("key")).rejects.toThrow(TooManyRequestsError);
  });

  test("ウィンドウ経過後にカウンターがリセットされる", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordFailure("key");
    await limiter.recordFailure("key");
    await limiter.recordFailure("key");

    vi.advanceTimersByTime(60_000);

    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("resetでカウンターがクリアされる", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordFailure("key");
    await limiter.recordFailure("key");
    await limiter.recordFailure("key");

    await limiter.reset("key");

    await expect(limiter.check("key")).resolves.toBeUndefined();
  });

  test("キーごとに独立してカウントする", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await limiter.recordFailure("key-a");
    await limiter.recordFailure("key-a");
    await limiter.recordFailure("key-a");

    await expect(limiter.check("key-a")).rejects.toThrow(TooManyRequestsError);
    await expect(limiter.check("key-b")).resolves.toBeUndefined();
  });

  test("未記録のキーはcheckをパスする", async () => {
    const limiter = createInMemoryRateLimiter(config);
    await expect(limiter.check("unknown")).resolves.toBeUndefined();
  });
});
