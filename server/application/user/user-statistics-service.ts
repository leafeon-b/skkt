import type { UserId } from "@/server/domain/common/ids";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
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
    const [total, byCircle] = await Promise.all([
      deps.matchRepository.countMatchStatisticsByUserId(targetUserId),
      deps.matchRepository.countMatchStatisticsByUserIdGroupByCircle(
        targetUserId,
      ),
    ]);

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
    return deps.matchRepository.countMatchStatisticsByBothPlayerIds(
      targetUserId,
      opponentId,
    );
  },
});
