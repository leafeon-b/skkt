import type { CircleSessionId, RoundRobinScheduleId, UserId } from "../../common/ids";
import { assertValidDate } from "../../common/validation";
import { generateRounds, type Round } from "./generate-rounds";

export type RoundRobinSchedule = {
  id: RoundRobinScheduleId;
  circleSessionId: CircleSessionId;
  rounds: Round[];
  totalMatchCount: number;
  createdAt: Date;
};

export type RoundRobinScheduleCreateParams = {
  id: RoundRobinScheduleId;
  circleSessionId: CircleSessionId;
  participantIds: UserId[];
};

export type RoundRobinScheduleRestoreParams = {
  id: RoundRobinScheduleId;
  circleSessionId: CircleSessionId;
  rounds: Round[];
  totalMatchCount: number;
  createdAt: Date;
};

export const createRoundRobinSchedule = (
  params: RoundRobinScheduleCreateParams,
): RoundRobinSchedule => {
  const rounds = generateRounds(params.participantIds);
  const totalMatchCount = rounds.reduce(
    (sum, r) => sum + r.pairings.length,
    0,
  );

  return {
    id: params.id,
    circleSessionId: params.circleSessionId,
    rounds,
    totalMatchCount,
    createdAt: new Date(),
  };
};

export const restoreRoundRobinSchedule = (
  params: RoundRobinScheduleRestoreParams,
): RoundRobinSchedule => {
  assertValidDate(params.createdAt, "createdAt");

  return {
    id: params.id,
    circleSessionId: params.circleSessionId,
    rounds: params.rounds,
    totalMatchCount: params.totalMatchCount,
    createdAt: params.createdAt,
  };
};
