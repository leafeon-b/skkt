import type { Match } from "@/server/domain/models/match/match";
import type { MatchWithCircle } from "@/server/domain/models/match/match-read-models";
import type {
  CircleMatchStatisticsRow,
  UserMatchStatistics,
} from "@/server/domain/models/match/match-statistics";
import type {
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";

export type MatchRepository = {
  findById(id: MatchId): Promise<Match | null>;
  /** Returns matches ordered by createdAt ascending. */
  listByCircleSessionId(circleSessionId: CircleSessionId): Promise<Match[]>;
  /** Returns non-deleted matches where the player is player1 or player2. */
  listByPlayerId(playerId: UserId): Promise<Match[]>;
  /** Returns non-deleted matches where both players are matched. */
  listByBothPlayerIds(playerId: UserId, opponentId: UserId): Promise<Match[]>;
  /** Returns non-deleted matches with circle info via CircleSession. */
  listByPlayerIdWithCircle(playerId: UserId): Promise<MatchWithCircle[]>;
  /** 論理削除を除外し、player1/player2 両方のポジションから対戦相手IDを重複排除して返す。 */
  listDistinctOpponentIds(playerId: UserId): Promise<UserId[]>;
  /** 指定ユーザーの勝敗引き分け数を集計して返す（論理削除・UNKNOWN除外）。 */
  countMatchStatisticsByUserId(userId: UserId): Promise<UserMatchStatistics>;
  /** 指定ユーザーの勝敗引き分け数をサークル別に集計して返す（論理削除・UNKNOWN除外）。 */
  countMatchStatisticsByUserIdGroupByCircle(
    userId: UserId,
  ): Promise<CircleMatchStatisticsRow[]>;
  /** 指定ユーザーと対戦相手の勝敗引き分け数を集計して返す（論理削除・UNKNOWN除外）。 */
  countMatchStatisticsByBothPlayerIds(
    userId: UserId,
    opponentId: UserId,
  ): Promise<UserMatchStatistics>;
  save(match: Match): Promise<void>;
};
