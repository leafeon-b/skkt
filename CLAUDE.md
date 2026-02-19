# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

SKKT（将棋研究会管理ツール）は、将棋研究会の活動を管理するWebアプリケーションです。セッションのスケジュール、参加者管理、対局記録などを扱います。

## 前提条件

- **個人開発**: 商用利用は想定しておらず、趣味のプロジェクトとして開発
- **開発者**: 1人の日本人が開発・運用
- **デプロイ先**: Vercel（無料プラン）
- **想定ユーザー数**: 数名程度（開発者本人と少数の友人）

これらの前提から、過度なスケーラビリティ対応や複雑なインフラ構成は不要。シンプルさと開発効率を優先する。

## よく使うコマンド

```bash
# 開発
npm run dev              # 開発サーバー起動（ホットリロード有効）

# データベース
npm run db:migrate       # Prismaマイグレーション実行
npm run db:seed          # シードデータ投入
npm run db:reset         # DBリセット＋シード
npm run db:studio        # Prisma Studio起動

# テスト
npm run test             # ウォッチモードでテスト実行
npm run test:run         # テスト一回実行
npm run test:run -- path/to/file.test.ts  # 単一ファイルのテスト

# コード品質
npm run lint             # ESLint
npm run format           # Prettier
npx tsc --noEmit         # 型チェック
```

## アーキテクチャ

Next.js 16 / React 19 アプリケーション。クリーンアーキテクチャの4層構造を採用。

### レイヤー構成

```
server/
├── presentation/        # tRPCルーター、DTO、マッパー（API境界）
├── application/         # サービス層（ビジネスロジックの調整）
├── domain/              # エンティティ、リポジトリインターフェース、ポリシー
└── infrastructure/      # Prismaリポジトリ実装、NextAuthハンドラー
```

### 主要パターン

- **tRPC 11**: `/api/trpc/[trpc]` で型安全なAPI。ルーターは `server/presentation/trpc/routers/` に配置
- **リポジトリパターン**: インターフェースは `domain/models/*/`、実装は `infrastructure/repository/*/`
- **サービスコンテナ**: DIコンテナは `server/application/service-container.ts`
- **Branded Types**: 型安全なIDを `server/domain/common/ids.ts` で定義（例: `CircleId`, `UserId`）
- **論理削除**: Match, CircleMembership, CircleSessionMembership は `deletedAt` で論理削除。MatchHistory で変更履歴を記録

### サーバーコンポーネントのデータ取得

サーバーコンポーネントからのデータ取得には2つのパターンがあり、用途に応じて使い分ける。

**パターン1: tRPC Caller**（データ取得に使用）

```tsx
const ctx = await createContext();
const caller = appRouter.createCaller(ctx);
const data = await caller.users.me();
```

- tRPC ルーターの認証ミドルウェアと DTO マッピングを再利用できる
- クライアントと同じエンドポイントを通るため、レスポンス型が統一される
- **用途**: ビジネスデータの取得（ユーザー情報、セッション一覧、対局記録など）

**パターン2: 直接サービスアクセス**（認可チェック・補助的取得に使用）

```tsx
const ctx = await createContext();
const canCreate = await ctx.accessService.canCreateCircleSession(
  ctx.actorId,
  circleId,
);
```

- サービス層に直接アクセスし、tRPC の DTO マッピングを経由しない
- **用途**: 認可チェック（AccessService）、tRPC ルーターにないサービスメソッドの呼び出し

**使い分けの基準:**

- tRPC の認証ミドルウェアや DTO マッピングの恩恵がある → パターン1（tRPC Caller）
- クライアントに公開する必要がなく、tRPC 化の恩恵もない（認可チェックなど） → パターン2（直接サービスアクセス）
- 1つの Provider 内で両パターンの併用も可

### 認可

ロールベースのアクセス制御。2つの階層がある:

- **研究会ロール**: CircleOwner > CircleManager > CircleMember
- **セッションロール**: CircleSessionOwner > CircleSessionManager > CircleSessionMember

ポリシーは `server/domain/services/authz/policies.ts` で定義、`AccessService` で適用。

### フロントエンド

- App Routerのルートグループ: `(authenticated)/` は認証必須、`(public)/` は認証ページ
- UIコンポーネント: shadcn/ui（`components/ui/`）
- クライアント状態: tRPC + React Query
- スタイリング: Tailwind CSS v4（カスタムブランドカラー: moss, gold, sky, ink）

### データベース

PostgreSQL（Vercel Postgres）+ Prisma ORM。主要モデル:

- **Circle**: 研究会
- **CircleSession**: セッション
- **CircleMembership / CircleSessionMembership**: ロールベースの参加情報（論理削除対応）
- **Match**: 対局記録（論理削除対応）
- **MatchHistory**: 対局の変更履歴

## 人間とAIの協調開発ガイドライン

このプロジェクトでは、人間がマネージャー、AIが実装担当者として協力して開発を進める。最終的な責任は人間にあるため、重要な意思決定は人間が行う。

### 開発フロー

実装タスクでは **Planモード** を使って計画を立て、人間の承認を得てから実装に進む。

```
1. 人間がタスクを依頼
2. issueに基づく作業の場合、作業ブランチを新規作成（例: feature/issue-123-add-login）
3. AIがPlanモードに入る（複雑なタスクの場合）
4. AIがコードベースを調査し、実装計画を作成
5. 人間が計画をレビューし、承認または修正を指示
6. 承認後、AIが実装を進める
7. 人間が変更をレビューし、フィードバック
8. issueに基づく作業の場合、PRを作成して作業完了
```

### Planモードを使う基準

以下の場合はPlanモードで計画を立てる:

- 新機能の追加
- 複数ファイルにまたがる変更
- アーキテクチャに影響する変更
- 要件に曖昧さがある場合

以下の場合は直接実装してよい:

- 単純なバグ修正（1-2ファイル）
- タイポ修正、コメント追加
- 人間が具体的な実装内容を指示した場合

### 人間が行うこと

- **要件と背景の提供**: タスクの目的、制約、優先度を明確に伝える
- **計画のレビュー**: Planモードで提示された計画を確認し、承認または修正を指示
- **設計判断**: アーキテクチャや技術選定など、長期的影響のある決定を下す
- **コードレビュー**: 実装完了後、変更内容を確認する
- **フィードバック**: AIの提案や実装に対して改善点を伝える

### AIが行うこと

- **Planモードの活用**: 複雑なタスクは実装前にPlanモードで計画を立てる
- **確認と質問**: 要件が曖昧な場合は推測せず、人間に確認する
- **トレードオフの説明**: 複数の選択肢がある場合、メリット・デメリットを計画に記載
- **進捗の報告**: 作業状況や問題点を適宜共有する
- **承認待ち**: 破壊的変更、外部サービス連携、セキュリティ関連は必ず事前承認を得る

### ドキュメント管理

このプロジェクトでは、**ドキュメントをSSoT（Single Source of Truth）** として扱う。

- **常に最新に保つ**: 対話を通じて設計や仕様に変更があった場合、必ずドキュメントへの反映を行う
- **情報の陳腐化を防ぐ**: アーキテクチャ、命名規則、運用ルールなどの変更は即座に文書化する
- **承認を得てから更新**: ドキュメントの修正は必ず人間の承認を得てから適用する
- **対象ドキュメント**: CLAUDE.md、README.md、その他プロジェクト固有のドキュメント

AIは実装完了後、関連ドキュメントの更新が必要か確認し、必要であれば人間に提案する。

## テストアカウント（db:seed後）

対象研究会: 「京大将棋研究会」（circleId: `demo`）

- オーナー: sota@example.com / demo-pass-1
- マネージャー: hanyu@example.com / demo-pass-2, watanabe@example.com / demo-pass-3
- メンバー: ito@example.com / demo-pass-4
