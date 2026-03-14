/**
 * 対局統計の集計結果型
 *
 * リポジトリの集計クエリが返す読み取り専用の型定義。
 */
import type { CircleId } from "@/server/domain/common/ids";

export type UserMatchStatistics = {
  wins: number;
  losses: number;
  draws: number;
};

export type CircleMatchStatisticsRow = {
  circleId: CircleId;
  circleName: string;
  wins: number;
  losses: number;
  draws: number;
};
