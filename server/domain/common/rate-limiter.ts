export type RateLimiter = {
  /** レート制限チェック。超過時は TooManyRequestsError をスロー */
  check(key: string): Promise<void>;
  /** 試行を記録 */
  recordAttempt(key: string): Promise<void>;
  /** カウンターをリセット（成功時） */
  reset(key: string): Promise<void>;
};
