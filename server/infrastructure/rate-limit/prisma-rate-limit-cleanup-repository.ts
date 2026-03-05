import type { RateLimitCleanupRepository } from "@/server/domain/common/rate-limit-cleanup-repository";
import { prisma } from "@/server/infrastructure/db";

export const prismaRateLimitCleanupRepository: RateLimitCleanupRepository = {
  async deleteExpiredBefore(threshold: Date) {
    const result = await prisma.rateLimitAttempt.deleteMany({
      where: { attemptedAt: { lt: threshold } },
    });
    return result.count;
  },
};
