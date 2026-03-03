# カスタムエラー型の分類規約

## 目的

ドメイン層で発生するエラーを型安全に扱うための分類基準を明文化する。エラー型の選択に迷った場合の判断指針を提供する。

## 基底クラス: DomainError

すべてのカスタムエラーは `DomainError`（`server/domain/common/errors.ts`）を継承する。

```ts
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: DomainErrorCode,
  ) { ... }
}
```

`DomainErrorCode` は tRPC エラーコードと 1:1 で対応し、Presentation 層で自動変換される。

## エラー型一覧と使い分け

### UnauthorizedError（未認証）

- **コード**: `UNAUTHORIZED`
- **意味**: リクエスト元が認証されていない（ログインしていない）
- **使用箇所**: セッション取得時の `actorId` 欠落、tRPC `protectedProcedure` ミドルウェア
- **メッセージ**: デフォルト `"Unauthorized"`

```ts
// セッションにユーザーIDがない場合
throw new UnauthorizedError();
```

### ForbiddenError（認可失敗）

- **コード**: `FORBIDDEN`
- **意味**: 認証済みだが、操作に必要な権限がない
- **使用箇所**: `AccessService.canXxx()` が `false` を返した場合、オーナーシップルール違反
- **メッセージ**: デフォルト `"Forbidden"`。オーナーシップルールでは操作を案内するメッセージを付与

```ts
// 権限チェック失敗（デフォルトメッセージ）
if (!await accessService.canEditCircle(actorId, circleId)) {
  throw new ForbiddenError();
}

// オーナーシップルール違反（案内メッセージ付き）
throw new ForbiddenError("Owner cannot withdraw from circle. Use transferOwnership instead");
```

### BadRequestError（入力不正・ビジネス制約違反）

- **コード**: `BAD_REQUEST`
- **意味**: リクエストの内容が不正、またはビジネスルール上の制約に違反している
- **使用箇所**: ID バリデーション、フィールドバリデーション、ビジネスルール違反
- **メッセージ**: 必須。違反内容を説明する静的な文字列

```ts
// IDバリデーション
throw new BadRequestError("Invalid user ID");

// フィールドバリデーション
throw new BadRequestError("name is required");

// ビジネスルール違反
throw new BadRequestError("Players must belong to the circle session");
throw new BadRequestError("Circle must have exactly one owner");
```

### NotFoundError（エンティティ未検出）

- **コード**: `NOT_FOUND`
- **意味**: 指定されたエンティティが存在しない
- **使用箇所**: リポジトリの検索結果が `null` の場合、メンバーシップレコードが見つからない場合
- **メッセージ**: コンストラクタにエンティティ名を渡す（`"${entity} not found"` が自動生成される）

```ts
throw new NotFoundError("Circle");        // → "Circle not found"
throw new NotFoundError("Membership");    // → "Membership not found"
throw new NotFoundError("TargetMember");  // → "TargetMember not found"
```

### ConflictError（データ競合）

- **コード**: `CONFLICT`
- **意味**: 既存データとの重複により操作を完了できない
- **使用箇所**: メンバーシップの重複追加、ユーザーのメールアドレス重複、DB ユニーク制約違反
- **メッセージ**: 必須。競合内容を説明する静的な文字列

```ts
throw new ConflictError("Membership already exists");
throw new ConflictError("User already exists");
```

### TooManyRequestsError（レート制限超過）

- **コード**: `TOO_MANY_REQUESTS`
- **意味**: 単位時間あたりのリクエスト回数が制限を超えた
- **使用箇所**: レートリミッター（パスワード変更など）
- **メッセージ**: デフォルト `"Too many requests"`
- **追加フィールド**: `retryAfterMs`（リトライ可能になるまでのミリ秒）

```ts
throw new TooManyRequestsError(retryAfterMs);
```

## ForbiddenError vs BadRequestError の判断基準

#766 で確立された基準:

| 観点 | ForbiddenError | BadRequestError |
|------|---------------|-----------------|
| **原因** | 「誰が」の問題（権限不足） | 「何を」の問題（入力・状態が不正） |
| **判定主体** | AccessService / オーナーシップルール | バリデーション / ビジネスルール |
| **典型例** | マネージャーがオーナー専用操作を実行 | 必須フィールドの欠落、不正なID |
| **ユーザーへの示唆** | 権限のある人に依頼する | 入力を修正して再試行する |

**判断フロー:**

1. 操作主体の権限が不足している → `ForbiddenError`
2. 権限はあるが、入力値やデータの状態が不正 → `BadRequestError`
3. オーナーシップの構造的制約（例: オーナーが脱退できない） → `ForbiddenError`（代替操作を案内）
4. データ整合性の制約（例: オーナーは1人のみ） → `BadRequestError`

## エラーメッセージの原則

`DomainError` の `message` はクライアントにそのまま送信される（`toTrpcError` で tRPC エラーに変換される際、`message` がそのまま使われる）。

**守るべきルール:**

- 静的な文字列のみ使用する（動的データを含めない）
- ユーザーID、メールアドレス、SQL などの内部情報を含めない
- クライアントが表示しても安全な内容にする

```ts
// OK: 静的メッセージ
throw new BadRequestError("Email already in use");

// NG: 動的データを含む
throw new BadRequestError(`User ${userId} not found`);  // ← IDを含めない
throw new BadRequestError(`${email} is invalid`);        // ← メールアドレスを含めない
```

## tRPC 変換

`server/presentation/trpc/errors.ts` の `toTrpcError` が `DomainError` を tRPC エラーに自動変換する。

| DomainErrorCode | tRPC エラーコード |
|-----------------|------------------|
| `NOT_FOUND` | `NOT_FOUND` |
| `FORBIDDEN` | `FORBIDDEN` |
| `UNAUTHORIZED` | `UNAUTHORIZED` |
| `BAD_REQUEST` | `BAD_REQUEST` |
| `CONFLICT` | `CONFLICT` |
| `TOO_MANY_REQUESTS` | `TOO_MANY_REQUESTS` |

- `DomainError` 以外の未ハンドル例外は `INTERNAL_SERVER_ERROR` に変換され、元のメッセージはログに記録されるがクライアントには送信されない
- `TooManyRequestsError` の `retryAfterMs` は tRPC エラーの `cause` 経由で `shape.data.retryAfterMs` としてクライアントに伝播する

## 補足: Result 型パターン

`SignupService` は例外的に `DomainError` を throw せず、`SignupResult` 型（discriminated union）を返す。

```ts
type SignupResult =
  | { success: true; userId: UserId }
  | { success: false; error: "terms_not_agreed" | "invalid_email" | ... };
```

これはサインアップフォームのように、バリデーションエラーが正常系の一部として扱われるケースに適している。ただし、DB 層の `ConflictError`（メール重複のレースコンディション対策）は catch して `{ success: false, error: "email_exists" }` に変換している。

このパターンは現時点では `SignupService` のみで使用されており、標準的なエラーハンドリングは `DomainError` の throw を基本とする。
