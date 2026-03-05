import type { RateLimitCleanupRepository } from "@/server/domain/common/rate-limit-cleanup-repository";

const CLEANUP_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

type RateLimitCleanupServiceDeps = {
  rateLimitCleanupRepository: RateLimitCleanupRepository;
};

export const createRateLimitCleanupService = (
  deps: RateLimitCleanupServiceDeps,
) => ({
  cleanupExpired: async (): Promise<number> => {
    const threshold = new Date(Date.now() - CLEANUP_THRESHOLD_MS);
    return deps.rateLimitCleanupRepository.deleteExpiredBefore(threshold);
  },
});

export type RateLimitCleanupService = ReturnType<
  typeof createRateLimitCleanupService
>;
