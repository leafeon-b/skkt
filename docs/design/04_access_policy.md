# 権限ポリシー

## 本ドキュメントの目的

本システムにおいて「誰が」「何を」操作できるか（権限の条件）を定義する。

## 表記

- ✅: 許可
- ❌: 不許可
- `-` : 対象外（当該スコープでは主体が成立しない／要件として定義しない）

## 前提（共通）

- 本システムは登録済みユーザーのみが利用できる（未登録ユーザーは不可）
- 本書に明記されていない操作は原則として許可しない
- 研究会の作成者は、その研究会の `CircleOwner` になる
- 開催回の作成者は、その開催回の `CircleSessionOwner` になる
- 同一ユーザーが研究会ロールと開催回ロールの両方を持つことがある（権限は合算）

## ロール定義

### 研究会ロール（研究会ごと）

- `CircleOwner`
  - 研究会の最終責任者。研究会のロール付与・移譲、削除などを行える。
- `CircleManager`
  - 研究会運営を委任された担当者。研究会情報や参加者管理などを行える。
- `CircleMember`
  - 研究会に所属するユーザー。閲覧や対局関連の操作ができる。

### 開催回ロール（開催回ごと）

- `CircleSessionOwner`
  - 開催回の最終責任者（原則として作成者）。開催回のロール付与・移譲、削除などを行える。
- `CircleSessionManager`
  - 開催回運営を委任された担当者。開催回情報や参加者管理などを行える。
- `CircleSessionMember`
  - 当該開催回の参加者（研究会外部ユーザーを含む）。

### ロールの序列

- `Owner` > `Manager` > `Member`
- `X+` は「`X` 以上（`X` またはそれより上位ロール）」を表す
  - 例: `CircleManager+` = `CircleManager` または `CircleOwner`

## 不変条件

- 研究会には `CircleOwner` が必ず 1 人存在する（0 人・2 人以上は不可）
- 開催回には `CircleSessionOwner` が必ず 1 人存在する（0 人・2 人以上は不可）
- `Owner` は `Owner` を移譲できる（移譲後も Owner は常に 1 人）

---

## グローバル操作（研究会に紐づかない操作）

| 操作                           | 登録済みユーザー |
| ------------------------------ | ---------------- |
| 研究会を作成                   | ✅               |
| 参加している研究会の一覧を閲覧 | ✅               |

---

## 研究会（Circle）

| 操作                     | 必要な Circle ロール | 必要な CircleSession ロール | 補足                                                 |
| ------------------------ | -------------------- | --------------------------- | ---------------------------------------------------- |
| 研究会を閲覧（基本情報） | `CircleMember+`      | `CircleSessionMember+`      | 開催回参加者にも、親となる研究会の基本情報は閲覧可能 |
| 研究会の詳細情報を編集   | `CircleManager+`     | -                           |                                                      |
| 研究会を削除             | `CircleOwner`        | -                           |                                                      |
| 研究会の参加者一覧を閲覧 | `CircleMember+`      | -                           | 研究会外部ユーザーには公開しない                     |
| 研究会に参加者を追加     | `CircleManager+`     | -                           |                                                      |
| 研究会ロールを付与/変更  | `CircleOwner`        | -                           |                                                      |
| 研究会オーナーを移譲     | `CircleOwner`        | -                           |                                                      |

---

## 開催回（CircleSession）

| 操作                           | 必要な Circle ロール | 必要な CircleSession ロール | 補足                                                     |
| ------------------------------ | -------------------- | --------------------------- | -------------------------------------------------------- |
| 開催回を作成                   | `CircleManager+`     | -                           | 作成後、作成者は当該開催回の `CircleSessionOwner` になる |
| 開催回を閲覧                   | `CircleMember+`      | `CircleSessionMember+`      |                                                          |
| 開催回の詳細情報を編集         | `CircleManager+`     | `CircleSessionManager+`     |                                                          |
| 開催回を削除                   | `CircleOwner`        | `CircleSessionOwner`        | いずれかを満たせば許可（合算）                           |
| 開催回参加者を追加             | `CircleManager+`     | `CircleSessionManager+`     |                                                          |
| 開催回参加者を参加取消（除外） | `CircleManager+`     | `CircleSessionManager+`     |                                                          |
| 開催回ロールを付与/変更        | `CircleOwner`        | `CircleSessionOwner`        | いずれかを満たせば許可（合算）                           |
| 開催回オーナーを移譲           | `CircleOwner`        | `CircleSessionOwner`        | いずれかを満たせば許可（合算）                           |

---

## 対局結果（Match）

前提:

- 対局結果の削除は論理削除として扱う（記録・編集履歴は残る）

| 操作                       | 必要な Circle ロール | 必要な CircleSession ロール | 補足 |
| -------------------------- | -------------------- | --------------------------- | ---- |
| 対局結果を閲覧             | `CircleMember+`      | `CircleSessionMember+`      |      |
| 対局結果を記録（作成）     | `CircleMember+`      | `CircleSessionMember+`      |      |
| 対局結果を修正             | `CircleMember+`      | `CircleSessionMember+`      |      |
| 対局結果を削除（論理削除） | `CircleMember+`      | `CircleSessionMember+`      |      |

---

## 対局結果の編集履歴（MatchHistory）

前提:

- 編集履歴はシステムが自動的に記録する
- ユーザーは閲覧のみ可能（直接操作は不可）

| 操作           | 必要な Circle ロール | 必要な CircleSession ロール | 補足 |
| -------------- | -------------------- | --------------------------- | ---- |
| 編集履歴を閲覧 | `CircleMember+`      | `CircleSessionMember+`      |      |
