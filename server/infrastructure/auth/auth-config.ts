import type { PrismaRateLimiterConfig } from "@/server/infrastructure/rate-limit/prisma-rate-limiter";

export const LOGIN_RATE_LIMIT_CONFIG: Readonly<PrismaRateLimiterConfig> =
  Object.freeze({
    maxAttempts: 5,
    windowMs: 60_000,
    category: "login",
  });

export const LOGIN_IP_RATE_LIMIT_CONFIG: Readonly<PrismaRateLimiterConfig> =
  Object.freeze({
    maxAttempts: 20,
    windowMs: 60_000,
    category: "login-ip",
  });

export const SIGNUP_RATE_LIMIT_CONFIG: Readonly<PrismaRateLimiterConfig> =
  Object.freeze({
    maxAttempts: 10,
    windowMs: 60_000,
    category: "signup",
  });
