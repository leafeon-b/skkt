import type { RateLimiter } from "@/server/domain/common/rate-limiter";

/**
 * 何もしない RateLimiter 実装。authorize コールバックが呼ばれないコンテキスト
 * （例: getServerSession によるセッション検証）でのみ使用すること。
 */
export const noopRateLimiter: RateLimiter = {
  async check() {},
  async recordAttempt() {},
  async reset() {},
};
