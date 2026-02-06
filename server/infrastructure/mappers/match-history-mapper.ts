import type { MatchHistory as PrismaMatchHistory } from "@/generated/prisma/client";
import { createMatchHistory } from "@/server/domain/models/match-history/match-history";
import type {
  MatchHistory,
  MatchHistoryAction,
} from "@/server/domain/models/match-history/match-history";
import type { MatchOutcome } from "@/server/domain/models/match/match";
import { matchHistoryId, matchId, userId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapMatchHistoryToDomain = (
  history: PrismaMatchHistory,
): MatchHistory =>
  createMatchHistory({
    id: matchHistoryId(history.id),
    matchId: matchId(history.matchId),
    editorId: userId(history.editorId),
    action: history.action as MatchHistoryAction,
    createdAt: history.createdAt,
    order: history.order,
    player1Id: userId(history.player1Id),
    player2Id: userId(history.player2Id),
    outcome: history.outcome as MatchOutcome,
  });

export const mapMatchHistoryToPersistence = (history: MatchHistory) => ({
  id: toPersistenceId(history.id),
  matchId: toPersistenceId(history.matchId),
  editorId: toPersistenceId(history.editorId),
  action: history.action,
  createdAt: history.createdAt,
  order: history.order,
  player1Id: toPersistenceId(history.player1Id),
  player2Id: toPersistenceId(history.player2Id),
  outcome: history.outcome,
});
