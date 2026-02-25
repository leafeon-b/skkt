import type { MatchOutcome } from "@/server/domain/models/match/match";

export type UserOutcome = "win" | "loss" | "draw";

export const classifyOutcomeForUser = (
  outcome: MatchOutcome,
  isPlayer1: boolean,
): UserOutcome | null => {
  switch (outcome) {
    case "UNKNOWN":
      return null;
    case "DRAW":
      return "draw";
    case "P1_WIN":
      return isPlayer1 ? "win" : "loss";
    case "P2_WIN":
      return isPlayer1 ? "loss" : "win";
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
};
