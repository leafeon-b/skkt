import { createRateLimitCleanupService } from "@/server/application/rate-limit/rate-limit-cleanup-service";
import { prismaRateLimitCleanupRepository } from "@/server/infrastructure/rate-limit/prisma-rate-limit-cleanup-repository";

export const rateLimitCleanupService = createRateLimitCleanupService({
  rateLimitCleanupRepository: prismaRateLimitCleanupRepository,
});
