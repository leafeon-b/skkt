# 境界づけ（Bounded Context）

## 目的

本ドキュメントは、ドメインを境界づけ（Bounded Context）に分割し、
用語・責務・主要エンティティの境界を明確にする。

## Context 一覧

- Circle Context（研究会）
- CircleSession Context（セッション）
- Match Context（対局結果）
- Auth Context（認証/認可）
- Identity Context（ユーザー）

## Circle Context（研究会）

### 目的

研究会の作成・編集・削除、および研究会参加（ロール）を扱う。

### 主要エンティティ/値

- **Circle**（Aggregate Root）
- CircleMembership（研究会参加）
- **CircleInviteLink**（独立した Aggregate Root）
- CircleRole（Value Object）
- CircleId / CircleInviteLinkId / InviteLinkToken（Value Object — Branded Type）

### 代表的な不変条件

- アクティブ（`deletedAt IS NULL`）なメンバーのうち、CircleOwner は必ず 1 人
- 研究会参加者は研究会ごとに 1 ロールのみ
- メンバー数のカウントは論理削除レコードを除外する

### 所管するユースケース例

- 研究会の作成/編集/削除
- 研究会参加者の追加/論理削除（退会・除名）/ロール変更
- 研究会オーナー移譲

## CircleSession Context（セッション）

### 目的

セッションの作成・編集・削除、およびセッション参加（ロール）を扱う。

### 主要エンティティ/値

- **CircleSession**（Aggregate Root）
- CircleSessionMembership（セッション参加）
- CircleSessionRole（Value Object）
- CircleSessionId（Value Object — Branded Type）

### 代表的な不変条件

- アクティブ（`deletedAt IS NULL`）な参加者のうち、CircleSessionOwner は必ず 1 人
- セッション参加者はセッションごとに 1 ロールのみ
- セッションは必ず 1 つの研究会に属する
- 参加者数のカウントは論理削除レコードを除外する

### 所管するユースケース例

- セッションの作成/編集/削除
- セッション参加者の追加/参加取消（論理削除）/ロール変更
- セッションオーナー移譲

## Match Context（対局結果）

### 目的

対局結果の作成・編集・削除を扱う。

### 主要エンティティ/値

- **Match**（Aggregate Root）
- MatchId（Value Object — Branded Type）
- MatchWithCircle（Read Model）

### 代表的な不変条件

- 対局者はセッション参加者である
- player1 != player2

### 所管するユースケース例

- 対局結果の記録/修正/削除

## Auth Context（認証/認可）

### 目的

ログイン状態の判定と権限判定を扱う。

### 代表的な不変条件

- 上位ロールのユーザーは下位ロールによって変更されない

### 所管するユースケース例

- 認証状態の確認
- 認可ポリシーの判定

### コンテキスト間の依存

Auth Context は認可判定のために以下の型を参照する:

- Identity Context: UserRepository（認証時のユーザー解決）
- Circle Context: CircleRole, CircleRepository（Membership の参照も CircleRepository 経由）
- CircleSession Context: CircleSessionRole, CircleSessionRepository

## Identity Context（ユーザー）

### 目的

ユーザーの登録・プロフィール管理を扱う。

### 主要エンティティ/値

- **User**（Aggregate Root）
- ProfileVisibility（Value Object）
- UserId（Value Object — Branded Type）

### 代表的な不変条件

- メールアドレスはユーザー間で一意

### 所管するユースケース例

- ユーザー登録（サインアップ）
- プロフィールの取得/編集
- プロフィール公開設定の変更

## Context 間の関係

- CircleSession は Circle に従属する
- Match は CircleSession に従属する
- Auth は各 Context の操作権限を判定する横断的な Context
- Auth は Identity Context の UserRepository を参照する（認証時のユーザー解決）

## 実装上の配置（目安）

- Circle Context
  - `server/domain/models/circle/*`（CircleMembership を含む）
  - `server/application/circle/*`
  - `server/infrastructure/repository/circle/*`（CircleMembership の永続化を含む）
  - 独立 Aggregate Root の CircleInviteLink は専用ディレクトリに配置:
    - `server/domain/models/circle-invite-link/*`
    - `server/infrastructure/repository/circle-invite-link/*`
- CircleSession Context
  - `server/domain/models/circle-session/*`
  - `server/application/circle-session/*`
  - `server/infrastructure/repository/circle-session/*`
- Match Context
  - `server/domain/models/match/*`
  - `server/application/match/*`
  - `server/infrastructure/repository/match/*`
- Auth Context
  - `server/domain/services/authz/*`
  - `server/application/authz/*`
  - `server/infrastructure/repository/authz/*`
- Identity Context
  - `server/domain/models/user/*`
  - `server/application/user/*`
  - `server/infrastructure/repository/user/*`

## レイヤーごとのディレクトリ方針

レイヤー間でディレクトリの粒度が異なるのは意図的な設計判断である。各レイヤーの責務に応じて最適な粒度を選択している。

### Domain 層 / Infrastructure リポジトリ層 — Aggregate Root 単位

Domain 層（`server/domain/models/`）と Infrastructure リポジトリ層（`server/infrastructure/repository/`）は、**Aggregate Root ごとにディレクトリを分離** する。

```
domain/models/
├── circle/                  # Circle（Aggregate Root）+ CircleMembership
├── circle-invite-link/      # CircleInviteLink（独立 Aggregate Root）
├── circle-session/          # CircleSession（Aggregate Root）+ CircleSessionMembership
├── match/                   # Match（Aggregate Root）
└── user/                    # User（Aggregate Root）
```

**理由**: エンティティとリポジトリインターフェースは 1:1 で対応するため、Aggregate Root 単位でまとめるのが最も自然な粒度となる。CircleInviteLink のように独立した Aggregate Root は、同じ Bounded Context 内であっても専用ディレクトリに配置する。

### Application 層 — Bounded Context 単位

Application 層（`server/application/`）は、**Bounded Context 単位でディレクトリをグルーピング** する。

```
application/
├── circle/                  # Circle Context のサービス群
│   ├── circle-service.ts
│   ├── circle-membership-service.ts
│   └── circle-invite-link-service.ts
├── circle-session/          # CircleSession Context のサービス群
│   ├── circle-session-service.ts
│   └── circle-session-membership-service.ts
├── match/                   # Match Context
├── authz/                   # Auth Context
└── user/                    # Identity Context
```

**理由**: Application サービスは複数の Aggregate Root を調整する役割を持つ。たとえば `circle/` ディレクトリには Circle・CircleMembership・CircleInviteLink の 3 つのサービスが同居する。これらは同じ Bounded Context に属し、相互に関連するユースケースを扱うため、Context 単位でまとめるほうが見通しがよい。

### Presentation 層（DTO・マッパー・tRPC ルーター） — フラット

Presentation 層の DTO（`server/presentation/dto/`）、マッパー（`server/presentation/mappers/`）、tRPC ルーター（`server/presentation/trpc/routers/`）は、**サブディレクトリを作らずフラットに配置** する。

**理由**: Presentation 層のファイルは 1 エンティティにつき 1 ファイルの単純な構造であり、ファイル数も限定的である。サブディレクトリに分けるとナビゲーションが深くなるだけで見通しが悪化するため、フラットな配置が適切である。

### Infrastructure マッパー層 — フラット

Infrastructure マッパー（`server/infrastructure/mappers/`）は、**サブディレクトリを作らずフラットに配置** する。

**理由**: Prisma モデルとドメインモデルの変換は 1 エンティティにつき 1 マッパーの単純な対応関係であり、Presentation 層のマッパーと同様にフラットな配置で十分である。
