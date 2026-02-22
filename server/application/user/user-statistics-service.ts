import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type {
  CircleMatchStatistics,
  UserMatchStatistics,
} from "@/server/domain/models/match/match-statistics";

type UserStatisticsServiceDeps = {
  matchRepository: MatchRepository;
};

export const createUserStatisticsService = (
  deps: UserStatisticsServiceDeps,
) => ({
  async getMatchStatistics(targetUserId: UserId): Promise<UserMatchStatistics> {
    const matches = await deps.matchRepository.listByUserId(targetUserId);

    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const match of matches) {
      if (match.outcome === "UNKNOWN") continue;

      if (match.outcome === "DRAW") {
        draws++;
        continue;
      }

      const isPlayer1 = match.player1Id === targetUserId;

      if (
        (isPlayer1 && match.outcome === "P1_WIN") ||
        (!isPlayer1 && match.outcome === "P2_WIN")
      ) {
        wins++;
      } else {
        losses++;
      }
    }

    return { wins, losses, draws };
  },

  async getMatchStatisticsByCircle(
    targetUserId: UserId,
  ): Promise<CircleMatchStatistics[]> {
    const matches =
      await deps.matchRepository.listByUserIdWithCircleSession(targetUserId);

    const circleMap = new Map<
      CircleId,
      { circleName: string; wins: number; losses: number; draws: number }
    >();

    for (const match of matches) {
      if (match.outcome === "UNKNOWN") continue;

      let entry = circleMap.get(match.circleId);
      if (!entry) {
        entry = { circleName: match.circleName, wins: 0, losses: 0, draws: 0 };
        circleMap.set(match.circleId, entry);
      }

      if (match.outcome === "DRAW") {
        entry.draws++;
        continue;
      }

      const isPlayer1 = match.player1Id === targetUserId;

      if (
        (isPlayer1 && match.outcome === "P1_WIN") ||
        (!isPlayer1 && match.outcome === "P2_WIN")
      ) {
        entry.wins++;
      } else {
        entry.losses++;
      }
    }

    return Array.from(circleMap.entries()).map(([cId, stats]) => ({
      circleId: cId,
      ...stats,
    }));
  },
});
