export type RateLimiter = {
  /** レート制限チェック。超過時は TooManyRequestsError をスロー */
  check(key: string): Promise<void>;
  /** 失敗を記録 */
  recordFailure(key: string): Promise<void>;
  /** カウンターをリセット（成功時） */
  reset(key: string): Promise<void>;
};
