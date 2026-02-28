import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import { TooManyRequestsError } from "@/server/domain/common/errors";

export type InMemoryRateLimiterConfig = {
  maxAttempts: number;
  windowMs: number;
};

export const createInMemoryRateLimiter = (
  config: InMemoryRateLimiterConfig,
): RateLimiter => {
  const failures = new Map<string, number[]>();

  const prune = (key: string, now: number): number[] => {
    const timestamps = failures.get(key);
    if (!timestamps) return [];
    const valid = timestamps.filter((t) => now - t < config.windowMs);
    if (valid.length === 0) {
      failures.delete(key);
      return [];
    }
    failures.set(key, valid);
    return valid;
  };

  return {
    async check(key) {
      const now = Date.now();
      const recent = prune(key, now);
      if (recent.length >= config.maxAttempts) {
        const retryAfterMs = recent[0] + config.windowMs - now;
        throw new TooManyRequestsError(retryAfterMs);
      }
    },

    async recordFailure(key) {
      const now = Date.now();
      const recent = prune(key, now);
      recent.push(now);
      failures.set(key, recent);
    },

    async reset(key) {
      failures.delete(key);
    },
  };
};
