import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import { classifyOutcomeForUser } from "@/server/domain/models/match/match";
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
  async getMatchStatisticsAll(
    targetUserId: UserId,
  ): Promise<{
    total: UserMatchStatistics;
    byCircle: CircleMatchStatistics[];
  }> {
    const matches =
      await deps.matchRepository.listByUserIdWithCircleSession(targetUserId);

    const total = { wins: 0, losses: 0, draws: 0 };
    const circleMap = new Map<
      CircleId,
      { circleName: string; wins: number; losses: number; draws: number }
    >();

    for (const match of matches) {
      const isPlayer1 = match.player1Id === targetUserId;
      const classified = classifyOutcomeForUser(match.outcome, isPlayer1);
      if (classified === null) continue;

      // Update total
      if (classified === "win") total.wins++;
      else if (classified === "loss") total.losses++;
      else total.draws++;

      // Update per-circle
      let entry = circleMap.get(match.circleId);
      if (!entry) {
        entry = { circleName: match.circleName, wins: 0, losses: 0, draws: 0 };
        circleMap.set(match.circleId, entry);
      }

      if (classified === "win") entry.wins++;
      else if (classified === "loss") entry.losses++;
      else entry.draws++;
    }

    const byCircle = Array.from(circleMap.entries()).map(([cId, stats]) => ({
      circleId: cId,
      ...stats,
    }));

    return { total, byCircle };
  },
});
