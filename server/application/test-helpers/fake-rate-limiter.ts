import type { RateLimiter } from "@/server/domain/common/rate-limiter";

export const createFakeRateLimiter = (): RateLimiter & {
  attempts: string[];
  resets: string[];
} => {
  const attempts: string[] = [];
  const resets: string[] = [];
  return {
    attempts,
    resets,
    async check() {},
    async recordAttempt(key) {
      attempts.push(key);
    },
    async reset(key) {
      resets.push(key);
    },
  };
};
