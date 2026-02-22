import type {
  CircleId,
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import {
  assertDifferentIds,
  assertValidDate,
} from "@/server/domain/common/validation";

export type MatchOutcome = "P1_WIN" | "P2_WIN" | "DRAW" | "UNKNOWN";

export type Match = {
  id: MatchId;
  circleSessionId: CircleSessionId;
  createdAt: Date;
  player1Id: UserId;
  player2Id: UserId;
  outcome: MatchOutcome;
  deletedAt: Date | null;
};

export const hasDifferentPlayers = (
  player1Id: UserId,
  player2Id: UserId,
): boolean => player1Id !== player2Id;

export type MatchCreateParams = {
  id: MatchId;
  circleSessionId: CircleSessionId;
  player1Id: UserId;
  player2Id: UserId;
  outcome?: MatchOutcome;
};

export type MatchRestoreParams = {
  id: MatchId;
  circleSessionId: CircleSessionId;
  createdAt: Date;
  player1Id: UserId;
  player2Id: UserId;
  outcome: MatchOutcome;
  deletedAt?: Date | null;
};

export const createMatch = (params: MatchCreateParams): Match => {
  assertDifferentIds(params.player1Id, params.player2Id, "players");

  return {
    id: params.id,
    circleSessionId: params.circleSessionId,
    createdAt: new Date(),
    player1Id: params.player1Id,
    player2Id: params.player2Id,
    outcome: params.outcome ?? "UNKNOWN",
    deletedAt: null,
  };
};

export const restoreMatch = (params: MatchRestoreParams): Match => {
  assertDifferentIds(params.player1Id, params.player2Id, "players");
  assertValidDate(params.createdAt, "createdAt");
  if (params.deletedAt != null) {
    assertValidDate(params.deletedAt, "deletedAt");
  }

  return {
    id: params.id,
    circleSessionId: params.circleSessionId,
    createdAt: params.createdAt,
    player1Id: params.player1Id,
    player2Id: params.player2Id,
    outcome: params.outcome,
    deletedAt: params.deletedAt ?? null,
  };
};

export const updateMatchOutcome = (
  match: Match,
  outcome: MatchOutcome,
): Match => ({
  ...match,
  outcome,
});

export const updateMatchPlayers = (
  match: Match,
  player1Id: UserId,
  player2Id: UserId,
): Match => {
  assertDifferentIds(player1Id, player2Id, "players");

  return {
    ...match,
    player1Id,
    player2Id,
  };
};

export const deleteMatch = (match: Match, deletedAt?: Date): Match => ({
  ...match,
  deletedAt: deletedAt ?? new Date(),
});

export type MatchWithCircle = Match & {
  circleId: CircleId;
  circleName: string;
};
