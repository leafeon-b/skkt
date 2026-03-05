export type RateLimitCleanupRepository = {
  deleteExpiredBefore(threshold: Date): Promise<number>;
};
