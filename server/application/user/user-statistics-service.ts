import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import { classifyOutcomeForUser } from "@/server/application/match/match-outcome";
import type {
  CircleMatchStatistics,
  UserMatchStatistics,
} from "./match-statistics";

export type OpponentInfo = {
  userId: UserId;
  name: string;
};

type UserStatisticsServiceDeps = {
  matchRepository: MatchRepository;
  userRepository: UserRepository;
};

export const createUserStatisticsService = (
  deps: UserStatisticsServiceDeps,
) => ({
  async getMatchStatisticsAll(targetUserId: UserId): Promise<{
    total: UserMatchStatistics;
    byCircle: CircleMatchStatistics[];
  }> {
    const matches =
      await deps.matchRepository.listByPlayerIdWithCircle(targetUserId);

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

    const byCircle = Array.from(circleMap.entries())
      .map(([cId, stats]) => ({
        circleId: cId,
        ...stats,
      }))
      .sort((a, b) => a.circleName.localeCompare(b.circleName, "ja"));

    return { total, byCircle };
  },

  async getOpponents(targetUserId: UserId): Promise<OpponentInfo[]> {
    const opponentIds =
      await deps.matchRepository.listDistinctOpponentIds(targetUserId);

    if (opponentIds.length === 0) return [];

    const users = await deps.userRepository.findByIds(opponentIds);
    return users
      .map((u) => ({ userId: u.id, name: u.name ?? "名前未設定" }))
      .sort((a, b) => a.name.localeCompare(b.name, "ja"));
  },

  async getOpponentRecord(
    targetUserId: UserId,
    opponentId: UserId,
  ): Promise<UserMatchStatistics> {
    const matches = await deps.matchRepository.listByBothPlayerIds(
      targetUserId,
      opponentId,
    );

    const stats: UserMatchStatistics = { wins: 0, losses: 0, draws: 0 };

    for (const match of matches) {
      const isPlayer1 = match.player1Id === targetUserId;
      const classified = classifyOutcomeForUser(match.outcome, isPlayer1);
      if (classified === null) continue;

      if (classified === "win") stats.wins++;
      else if (classified === "loss") stats.losses++;
      else stats.draws++;
    }

    return stats;
  },
});
