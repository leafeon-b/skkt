import type { Match, MatchWithCircle } from "@/server/domain/models/match/match";
import type {
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";

export type MatchRepository = {
  findById(id: MatchId): Promise<Match | null>;
  /** Returns matches ordered by createdAt ascending. */
  listByCircleSessionId(circleSessionId: CircleSessionId): Promise<Match[]>;
  /** Returns non-deleted matches where the user is player1 or player2. */
  listByUserId(userId: UserId): Promise<Match[]>;
  /** Returns non-deleted matches with circle info via CircleSession. */
  listByUserIdWithCircleSession(userId: UserId): Promise<MatchWithCircle[]>;
  save(match: Match): Promise<void>;
};
