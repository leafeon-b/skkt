import type {
  MatchHistoryId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import type { MatchOutcome } from "@/server/domain/models/match/match";
import {
  assertDifferentIds,
  assertValidDate,
} from "@/server/domain/common/validation";

export type MatchHistoryAction = "CREATE" | "UPDATE" | "DELETE";

export type MatchHistory = {
  id: MatchHistoryId;
  matchId: MatchId;
  editorId: UserId;
  action: MatchHistoryAction;
  createdAt: Date;
  player1Id: UserId;
  player2Id: UserId;
  outcome: MatchOutcome;
};

export type MatchHistoryCreateParams = {
  id: MatchHistoryId;
  matchId: MatchId;
  editorId: UserId;
  action: MatchHistoryAction;
  createdAt?: Date;
  player1Id: UserId;
  player2Id: UserId;
  outcome: MatchOutcome;
};

export const createMatchHistory = (
  params: MatchHistoryCreateParams,
): MatchHistory => {
  assertDifferentIds(params.player1Id, params.player2Id, "players");
  const createdAt = params.createdAt
    ? assertValidDate(params.createdAt, "createdAt")
    : new Date();

  return {
    id: params.id,
    matchId: params.matchId,
    editorId: params.editorId,
    action: params.action,
    createdAt,
    player1Id: params.player1Id,
    player2Id: params.player2Id,
    outcome: params.outcome,
  };
};
