# 用語集

## ドメイン用語

| 日本語             | 英語(システム内部用) | 説明                                                     |
| ------------------ | -------------------- | -------------------------------------------------------- |
| 研究会             | Circle               | ある程度決まったメンバーで継続的に開催される将棋の集まり |
| セッション         | CircleSession        | 研究会に属する 1 回分の開催                              |
| 対局結果           | Match                | 1 局 = 1 件の対局結果                                    |

## 権限・ロール

| 日本語                 | 英語(システム内部用) | 説明                                            |
| ---------------------- | -------------------- | ----------------------------------------------- |
| 研究会オーナー         | CircleOwner          | 研究会の最上位ロール（必ず 1 人、移譲可能）     |
| 研究会マネージャー     | CircleManager        | 研究会の運営を補助するロール                    |
| 研究会メンバー         | CircleMember         | 研究会の基本ロール                              |
| セッションオーナー     | CircleSessionOwner   | セッションの最上位ロール（必ず 1 人、移譲可能） |
| セッションマネージャー | CircleSessionManager | セッションの運営を補助するロール                |
| セッションメンバー     | CircleSessionMember  | セッションの基本ロール                          |

## 実装上の関連モデル

| 日本語         | 英語(システム内部用)    | 説明                                            |
| -------------- | ----------------------- | ----------------------------------------------- |
| 研究会参加     | CircleMembership        | ユーザーと研究会の関連（ロールを 1 つ保持）     |
| セッション参加 | CircleSessionMembership | ユーザーとセッションの関連（ロールを 1 つ保持） |
| 招待リンク     | CircleInviteLink        | 研究会への招待用リンク                          |

## Ubiquitous Language

本セクションでは、ドメイン用語の構造的な関係とコード上の名前の対応を整理する。

### 集約（Aggregate）一覧

| Aggregate Root    | 関連エンティティ                | Repository                         | Context        |
| ----------------- | ------------------------------- | ---------------------------------- | -------------- |
| Circle            | CircleMembership                | CircleRepository                   | Circle         |
| CircleInviteLink  | -                               | CircleInviteLinkRepository         | Circle         |
| CircleSession     | CircleSessionMembership         | CircleSessionRepository            | CircleSession  |
| Match             | -                               | MatchRepository                    | Match          |
| User              | -                               | UserRepository                     | Auth           |

※ 本プロジェクトでは Aggregate Root を「主要エンティティであり、他の集約からは ID でのみ参照される境界」として使用している。厳密な DDD の整合性境界（不変条件の強制、Root 経由の排他的アクセス）は現時点では実装していない。ドメインエンティティはプレーンな TypeScript 型（Anemic Domain Model）であり、関連エンティティの操作は Aggregate Root の Repository に統合されている。

### 用語階層構造

```
Circle（研究会）
├── CircleMembership（研究会参加）
│   └── CircleRole（CircleOwner / CircleManager / CircleMember）
├── CircleSession（セッション）
│   ├── CircleSessionMembership（セッション参加）
│   │   └── CircleSessionRole（CircleSessionOwner / CircleSessionManager / CircleSessionMember）
│   └── Match（対局結果）
└── CircleInviteLink（招待リンク）
```

※ この階層はドメインのナビゲーション構造を示す。集約の所有関係は「集約（Aggregate）一覧」を参照。

### Docs名⇔Code名 対応表

ドキュメント上の用語（Docs名）と各レイヤーで使用されるコード上の名前の対応を示す。

| Docs名                  | Domain Model               | Prisma Schema           | Presentation DTO              | Application Service                | 備考         |
| ----------------------- | -------------------------- | ----------------------- | ----------------------------- | ---------------------------------- | ------------ |
| Circle                  | Circle                     | Circle                  | CircleDto                     | CircleService                      | 統一済み     |
| CircleMembership        | CircleMembership           | CircleMembership        | CircleMembershipDto           | CircleMembershipService            | 統一済み     |
| CircleInviteLink        | CircleInviteLink           | CircleInviteLink        | CircleInviteLinkDto           | CircleInviteLinkService            | 統一済み     |
| CircleSession           | CircleSession              | CircleSession           | CircleSessionDto              | CircleSessionService               | 統一済み     |
| CircleSessionMembership | CircleSessionMembership    | CircleSessionMembership | CircleSessionMembershipDto    | CircleSessionMembershipService     | 統一済み     |
| Match                   | Match                      | Match                   | MatchDto                      | MatchService                       | 統一済み     |
| User                    | User                       | User                    | UserDto                       | UserService                        | 統一済み     |

### Entity / ValueObject 分類

ドメイン層の型を Entity と ValueObject に分類する。

#### Entity（識別子を持ち、ライフサイクルがある）

| Entity           | ID 型               | 定義ファイル                                       |
| ---------------- | -------------------- | -------------------------------------------------- |
| Circle           | CircleId             | `server/domain/models/circle/circle.ts`            |
| CircleMembership | CircleMembershipId   | `server/domain/models/circle-membership/circle-membership.ts` |
| CircleInviteLink | CircleInviteLinkId   | `server/domain/models/circle/circle-invite-link.ts` |
| CircleSession    | CircleSessionId      | `server/domain/models/circle-session/circle-session.ts` |
| CircleSessionMembership | CircleSessionMembershipId | `server/domain/models/circle-session/circle-session-membership.ts` |
| Match            | MatchId              | `server/domain/models/match/match.ts`              |
| User             | UserId               | `server/domain/models/user/user.ts`                |

#### ValueObject（識別子を持たず、値で等価判定する）

| ValueObject          | 型の種類         | 定義ファイル                                        |
| -------------------- | ---------------- | --------------------------------------------------- |
| CircleRole           | リテラル共用体   | `server/domain/services/authz/roles.ts`             |
| CircleSessionRole    | リテラル共用体   | `server/domain/services/authz/roles.ts`             |
| MatchOutcome         | リテラル共用体   | `server/domain/models/match/match.ts`               |
| ProfileVisibility    | リテラル共用体   | `server/domain/models/user/user.ts`                 |
| DomainErrorCode      | リテラル共用体   | `server/domain/common/errors.ts`                    |

※ Branded Type ID（`CircleId`, `UserId` 等）は Entity の識別子として使用されるが、型としては不変の ValueObject である。定義は `server/domain/common/ids.ts`。

### Repository 命名規則

| 項目             | 規則                                                 | 例                                     |
| ---------------- | ---------------------------------------------------- | -------------------------------------- |
| インターフェース名 | `<Entity名>Repository`                              | `CircleRepository`                     |
| インターフェース配置 | `server/domain/models/<domain>/` または `server/domain/services/<service>/` | `server/domain/models/circle/circle-repository.ts` |
| 実装クラス名     | `Prisma<Entity名>Repository`                         | `PrismaCircleRepository`               |
| 実装配置         | `server/infrastructure/repository/<domain>/`          | `server/infrastructure/repository/circle/` |
| ファクトリ関数   | `createPrisma<Entity名>Repository(client)`            | `createPrismaCircleRepository(client)` |
| シングルトン     | `prisma<Entity名>Repository`                          | `prismaCircleRepository`               |
| ファイル名       | ケバブケース `-repository.ts`                         | `circle-repository.ts`                 |

#### Repository 一覧

| Repository                              | 所属 Context   | 対象 Entity              |
| --------------------------------------- | -------------- | ------------------------ |
| CircleRepository                        | Circle         | Circle                   |
| CircleMembershipRepository              | Circle         | CircleMembership         |
| CircleInviteLinkRepository              | Circle         | CircleInviteLink         |
| CircleSessionRepository                 | CircleSession  | CircleSession            |
| CircleSessionMembershipRepository       | CircleSession  | CircleSessionMembership  |
| MatchRepository                         | Match          | Match                    |
| UserRepository                          | Auth           | User                     |
| SignupRepository                        | Auth           | User（登録専用）         |
| AuthzRepository                         | Auth           | -（認可クエリ専用）      |


### DomainService 責務整理

ドメインサービスは `server/domain/services/` に配置され、単一の Entity に属さないドメインロジックを担う。

#### authz モジュール（認可ドメインサービス）

| ファイル         | 責務                                             |
| ---------------- | ------------------------------------------------ |
| `roles.ts`       | ロール定義と比較（`isSameOrHigherCircleRole` 等） |
| `memberships.ts` | メンバーシップ状態の判別共用体型とファクトリ関数  |
| `ownership.ts`   | 所有権の不変条件（単一オーナー制約、移譲ロジック） |
| `authz-repository.ts` | 認可クエリ用リポジトリインターフェース       |

#### auth モジュール

| ファイル           | 責務                           |
| ------------------ | ------------------------------ |
| `session-service.ts` | セッション型定義（インターフェースのみ） |

#### 技術語とドメイン語の境界

| 用語                | 分類       | 説明                                                     |
| ------------------- | ---------- | -------------------------------------------------------- |
| CircleRole          | ドメイン語 | 研究会内のロール（Owner / Manager / Member）             |
| CircleSessionRole   | ドメイン語 | セッション内のロール（Owner / Manager / Member）         |
| AccessService       | 技術語     | 認可判定を集約するアプリケーションサービス（`server/application/authz/`） |
| AuthzRepository     | 技術語     | 認可クエリ用リポジトリ（ドメインサービス層に定義）        |
| Session（NextAuth） | 技術語     | 認証セッション（Auth インフラ関心事、UL 対象外）          |
| UnitOfWork          | 技術語     | トランザクション境界の抽象化（インフラ関心事）            |

### 既知の用語不整合

#### ~~authz 型の名前衝突~~（解消済み）

`server/domain/services/authz/memberships.ts` の認可状態を表す判別共用体型を `CircleMembershipStatus` / `CircleSessionMembershipStatus` にリネームし、ドメインエンティティ（`CircleMembership`）・Prisma モデル（`CircleMembership` / `CircleSessionMembership`）との名前衝突を解消した。
