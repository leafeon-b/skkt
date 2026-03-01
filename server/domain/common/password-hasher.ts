/**
 * パスワードハッシャーのポート定義
 *
 * アプリケーション層がパスワードのハッシュ化・検証機能に依存するためのインターフェース。
 * 具体的な実装（bcrypt など）はインフラ層で提供される。
 */
export type PasswordHasher = {
  /** 平文パスワードをハッシュ化する */
  hash(password: string): string;
  /** 平文パスワードがハッシュ値と一致するか検証する */
  verify(password: string, hashedValue: string): boolean;
};
