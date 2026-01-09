import type { UserId } from "@/server/domain/common/ids";
import type { Match } from "@/server/domain/models/match/match";

export const hasMatchParticipation = (
  matches: readonly Match[],
  userId: UserId,
): boolean =>
  matches.some(
    (match) => match.player1Id === userId || match.player2Id === userId,
  );

export const assertCanRemoveCircleSessionParticipation = (
  matches: readonly Match[],
  userId: UserId,
): void => {
  if (hasMatchParticipation(matches, userId)) {
    throw new Error("Participation cannot be removed because matches exist");
  }
};
