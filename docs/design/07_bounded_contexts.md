# 境界づけ（Bounded Context）

## 目的

本ドキュメントは、ドメインを境界づけ（Bounded Context）に分割し、
用語・責務・主要エンティティの境界を明確にする。

## Context 一覧

- Circle Context（研究会）
- CircleSession Context（セッション）
- Match Context（対局結果）
- Auth Context（認証/認可）

## Circle Context（研究会）

### 目的

研究会の作成・編集・削除、および研究会参加（ロール）を扱う。

### 主要エンティティ/値

- **Circle**（Aggregate Root）
- CircleMembership（研究会参加）
- **CircleInviteLink**（独立した Aggregate Root）
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

### 代表的な不変条件

- 対局者はセッション参加者である
- player1 != player2

### 所管するユースケース例

- 対局結果の記録/修正/削除

## Auth Context（認証/認可）

### 目的

ログイン状態の判定と権限判定を扱う。

### 主要エンティティ/値

- **User**（Aggregate Root）
- UserId（Value Object — Branded Type）
- CircleRole / CircleSessionRole

### 代表的な不変条件

- 上位ロールのユーザーは下位ロールによって変更されない

### 所管するユースケース例

- 認証状態の確認
- 認可ポリシーの判定

## Context 間の関係

- CircleSession は Circle に従属する
- Match は CircleSession に従属する
- Auth は各 Context の操作権限を判定する横断的な Context

## 実装上の配置（目安）

- Circle Context
  - `server/domain/models/circle/*`
  - `server/application/circle/*`
  - `server/infrastructure/repository/circle/*`
  - CircleMembership は専用ディレクトリに配置:
    - `server/domain/models/circle-membership/*`
    - `server/infrastructure/repository/circle-membership/*`
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
