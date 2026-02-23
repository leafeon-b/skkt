import type { Match } from "@/server/domain/models/match/match";
import type { MatchWithCircle } from "@/server/domain/models/match/match-read-models";
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
  /** Returns non-deleted matches where both players participated. */
  listByBothPlayerIds(playerId: UserId, opponentId: UserId): Promise<Match[]>;
  /** Returns non-deleted matches with circle info via CircleSession. */
  listByPlayerIdWithCircle(playerId: UserId): Promise<MatchWithCircle[]>;
  /** 論理削除を除外し、player1/player2 両方のポジションから対戦相手IDを重複排除して返す。 */
  listDistinctOpponentIds(playerId: UserId): Promise<UserId[]>;
  save(match: Match): Promise<void>;
};
