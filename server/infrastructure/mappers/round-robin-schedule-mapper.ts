import type {
  RoundRobinSchedule as PrismaRoundRobinSchedule,
  RoundRobinRound as PrismaRoundRobinRound,
  RoundRobinPairing as PrismaRoundRobinPairing,
} from "@/generated/prisma/client";
import { restoreRoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { Round } from "@/server/domain/models/round-robin-schedule/generate-rounds";
import {
  circleSessionId,
  roundRobinScheduleId,
  userId,
} from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

type PrismaRoundRobinScheduleWithRelations = PrismaRoundRobinSchedule & {
  rounds: (PrismaRoundRobinRound & {
    pairings: PrismaRoundRobinPairing[];
  })[];
};

export const mapRoundRobinScheduleToDomain = (
  schedule: PrismaRoundRobinScheduleWithRelations,
): RoundRobinSchedule => {
  const rounds: Round[] = schedule.rounds
    .sort((a, b) => a.roundNumber - b.roundNumber)
    .map((round) => ({
      roundNumber: round.roundNumber,
      pairings: round.pairings.map((pairing) => ({
        player1Id: userId(pairing.player1Id),
        player2Id: userId(pairing.player2Id),
      })),
    }));

  return restoreRoundRobinSchedule({
    id: roundRobinScheduleId(schedule.id),
    circleSessionId: circleSessionId(schedule.circleSessionId),
    rounds,
    totalMatchCount: schedule.totalMatchCount,
    createdAt: schedule.createdAt,
  });
};

export const mapRoundRobinScheduleToPersistence = (
  schedule: RoundRobinSchedule,
) => ({
  id: toPersistenceId(schedule.id),
  circleSessionId: toPersistenceId(schedule.circleSessionId),
  totalMatchCount: schedule.totalMatchCount,
  createdAt: schedule.createdAt,
  rounds: {
    create: schedule.rounds.map((round) => ({
      roundNumber: round.roundNumber,
      pairings: {
        create: round.pairings.map((pairing) => ({
          player1Id: toPersistenceId(pairing.player1Id),
          player2Id: toPersistenceId(pairing.player2Id),
        })),
      },
    })),
  },
});
