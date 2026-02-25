import type { RateLimiter } from "@/server/application/common/rate-limiter";
import { TooManyRequestsError } from "@/server/domain/common/errors";
import { prisma } from "@/server/infrastructure/db";

export type PrismaRateLimiterConfig = {
  maxAttempts: number;
  windowMs: number;
  category: string;
};

export const createPrismaRateLimiter = (
  config: PrismaRateLimiterConfig,
): RateLimiter => {
  return {
    async check(key) {
      const windowStart = new Date(Date.now() - config.windowMs);

      // pruning + count をトランザクションで実行（競合状態を防止）
      const [, count] = await prisma.$transaction([
        prisma.rateLimitAttempt.deleteMany({
          where: {
            category: config.category,
            attemptedAt: { lt: windowStart },
          },
        }),
        prisma.rateLimitAttempt.count({
          where: {
            key,
            category: config.category,
            attemptedAt: { gte: windowStart },
          },
        }),
      ]);

      if (count >= config.maxAttempts) {
        throw new TooManyRequestsError();
      }
    },

    async recordFailure(key) {
      await prisma.rateLimitAttempt.create({
        data: {
          key,
          category: config.category,
        },
      });
    },

    async reset(key) {
      await prisma.rateLimitAttempt.deleteMany({
        where: {
          key,
          category: config.category,
        },
      });
    },
  };
};
