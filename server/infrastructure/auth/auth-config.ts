import type { InMemoryRateLimiterConfig } from "@/server/infrastructure/rate-limit/in-memory-rate-limiter";

export const LOGIN_RATE_LIMIT_CONFIG: Readonly<InMemoryRateLimiterConfig> =
  Object.freeze({
    maxAttempts: 5,
    windowMs: 60_000,
  });
