/**
 * Match リードモデル
 *
 * リポジトリの結合クエリが返す読み取り専用の型定義。
 * ドメインエンティティ（Match）とは異なり、表示・集計用途のフラットな構造を持つ。
 */
import type { CircleId } from "@/server/domain/common/ids";
import type { Match } from "@/server/domain/models/match/match";

export type MatchWithCircle = Match & {
  circleId: CircleId;
  circleName: string;
};
