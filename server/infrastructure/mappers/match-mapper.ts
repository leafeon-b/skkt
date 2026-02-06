import type { Match as PrismaMatch } from "@/generated/prisma/client";
import { restoreMatch } from "@/server/domain/models/match/match";
import type { Match, MatchOutcome } from "@/server/domain/models/match/match";
import { circleSessionId, matchId, userId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapMatchToDomain = (match: PrismaMatch): Match =>
  restoreMatch({
    id: matchId(match.id),
    circleSessionId: circleSessionId(match.circleSessionId),
    order: match.order,
    player1Id: userId(match.player1Id),
    player2Id: userId(match.player2Id),
    outcome: match.outcome as MatchOutcome,
    deletedAt: match.deletedAt,
  });

export const mapMatchToPersistence = (match: Match) => ({
  id: toPersistenceId(match.id),
  circleSessionId: toPersistenceId(match.circleSessionId),
  order: match.order,
  player1Id: toPersistenceId(match.player1Id),
  player2Id: toPersistenceId(match.player2Id),
  outcome: match.outcome,
  deletedAt: match.deletedAt,
});
