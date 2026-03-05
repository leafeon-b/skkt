import type { RateLimiter } from "@/server/domain/common/rate-limiter";
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
      try {
        const now = Date.now();
        const windowStart = new Date(now - config.windowMs);

        // 確率的 pruning: 約10%の確率で期限切れレコードを削除（書き込み増幅の軽減）
        const shouldPrune = Math.random() < 0.1;

        const count = shouldPrune
          ? (
              await prisma.$transaction([
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
              ])
            )[1]
          : await prisma.rateLimitAttempt.count({
              where: {
                key,
                category: config.category,
                attemptedAt: { gte: windowStart },
              },
            });

        if (count >= config.maxAttempts) {
          const oldest = await prisma.rateLimitAttempt.findFirst({
            where: {
              key,
              category: config.category,
              attemptedAt: { gte: windowStart },
            },
            orderBy: { attemptedAt: "asc" },
            select: { attemptedAt: true },
          });

          const retryAfterMs = oldest
            ? oldest.attemptedAt.getTime() + config.windowMs - now
            : config.windowMs;

          throw new TooManyRequestsError(retryAfterMs);
        }
      } catch (error) {
        if (error instanceof TooManyRequestsError) throw error;
        console.error("[rate-limit] DB error during check:", error);
        throw new TooManyRequestsError(config.windowMs);
      }
    },

    async recordFailure(key) {
      try {
        await prisma.rateLimitAttempt.create({
          data: {
            key,
            category: config.category,
          },
        });
      } catch (error) {
        console.error("[rate-limit] DB error during recordFailure:", error);
      }
    },

    async reset(key) {
      try {
        await prisma.rateLimitAttempt.deleteMany({
          where: {
            key,
            category: config.category,
          },
        });
      } catch (error) {
        console.error("[rate-limit] DB error during reset:", error);
      }
    },
  };
};
