import type { UserId } from "@/server/domain/common/ids";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { User } from "@/server/domain/models/user/user";
import type { RoundRobinScheduleDto } from "@/server/presentation/dto/round-robin-schedule";

type PlayerInfo = { id: UserId; name: string | null; image: string | null };

const toPlayerInfo = (userId: UserId, userMap: Map<string, User>): PlayerInfo => {
  const user = userMap.get(userId as string);
  return {
    id: userId,
    name: user?.name ?? null,
    image: user?.image ?? null,
  };
};

export const toRoundRobinScheduleDto = (
  schedule: RoundRobinSchedule,
  userMap: Map<string, User>,
): RoundRobinScheduleDto => ({
  id: schedule.id,
  circleSessionId: schedule.circleSessionId,
  rounds: schedule.rounds.map((round) => ({
    roundNumber: round.roundNumber,
    pairings: round.pairings.map((pairing) => ({
      player1: toPlayerInfo(pairing.player1Id, userMap),
      player2: toPlayerInfo(pairing.player2Id, userMap),
    })),
  })),
  totalMatchCount: schedule.totalMatchCount,
  createdAt: schedule.createdAt,
});
