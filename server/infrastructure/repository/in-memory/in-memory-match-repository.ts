import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { Match, MatchOutcome } from "@/server/domain/models/match/match";
import type { MatchWithCircle } from "@/server/domain/models/match/match-read-models";
import type { UserMatchStatistics } from "@/server/domain/models/match/match-statistics";
import type { CircleMatchStatisticsRow } from "@/server/domain/models/match/match-statistics";
import type {
  CircleId,
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionStore } from "./in-memory-circle-session-repository";
import type { CircleStore } from "./in-memory-circle-repository";

export type MatchStore = Map<string, Match>;

const accumulateStats = (
  stats: UserMatchStatistics,
  outcome: MatchOutcome,
  isPlayer1: boolean,
): void => {
  switch (outcome) {
    case "P1_WIN":
      if (isPlayer1) stats.wins++;
      else stats.losses++;
      break;
    case "P2_WIN":
      if (isPlayer1) stats.losses++;
      else stats.wins++;
      break;
    case "DRAW":
      stats.draws++;
      break;
    case "UNKNOWN":
      break;
  }
};

export const createInMemoryMatchRepository = (
  matchStore: MatchStore = new Map(),
  deps?: {
    circleSessionStore: CircleSessionStore;
    circleStore: CircleStore;
  },
): MatchRepository & { readonly _store: MatchStore; _clear(): void } => ({
  _store: matchStore,

  _clear() {
    matchStore.clear();
  },

  async findById(id: MatchId): Promise<Match | null> {
    return matchStore.get(id) ?? null;
  },

  async listByCircleSessionId(
    circleSessionId: CircleSessionId,
  ): Promise<Match[]> {
    const matches: Match[] = [];
    for (const m of matchStore.values()) {
      if (m.circleSessionId === circleSessionId) {
        matches.push(m);
      }
    }
    return matches.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  },

  async listByPlayerId(playerId: UserId): Promise<Match[]> {
    const matches: Match[] = [];
    for (const m of matchStore.values()) {
      if (
        m.deletedAt === null &&
        (m.player1Id === playerId || m.player2Id === playerId)
      ) {
        matches.push(m);
      }
    }
    return matches.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  },

  async listByBothPlayerIds(
    playerId: UserId,
    opponentId: UserId,
  ): Promise<Match[]> {
    const matches: Match[] = [];
    for (const m of matchStore.values()) {
      if (m.deletedAt !== null) continue;
      const isPair =
        (m.player1Id === playerId && m.player2Id === opponentId) ||
        (m.player1Id === opponentId && m.player2Id === playerId);
      if (isPair) {
        matches.push(m);
      }
    }
    return matches.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  },

  async listByPlayerIdWithCircle(playerId: UserId): Promise<MatchWithCircle[]> {
    if (!deps) {
      throw new Error(
        "InMemoryMatchRepository requires circleSessionStore and circleStore for listByPlayerIdWithCircle",
      );
    }
    const matches: MatchWithCircle[] = [];
    for (const m of matchStore.values()) {
      if (m.deletedAt !== null) continue;
      if (m.player1Id !== playerId && m.player2Id !== playerId) continue;

      const session = deps.circleSessionStore.get(m.circleSessionId);
      if (!session) continue;
      const circle = deps.circleStore.get(session.circleId);
      if (!circle) continue;

      matches.push({
        ...m,
        circleId: circle.id,
        circleName: circle.name,
      });
    }
    return matches.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  },

  async listDistinctOpponentIds(playerId: UserId): Promise<UserId[]> {
    const ids = new Set<UserId>();
    for (const m of matchStore.values()) {
      if (m.deletedAt !== null) continue;
      if (m.player1Id === playerId) ids.add(m.player2Id);
      if (m.player2Id === playerId) ids.add(m.player1Id);
    }
    return [...ids];
  },

  async countMatchStatisticsByUserId(
    userId: UserId,
  ): Promise<UserMatchStatistics> {
    const stats: UserMatchStatistics = { wins: 0, losses: 0, draws: 0 };
    for (const m of matchStore.values()) {
      if (m.deletedAt !== null) continue;
      if (m.player1Id !== userId && m.player2Id !== userId) continue;
      accumulateStats(stats, m.outcome, m.player1Id === userId);
    }
    return stats;
  },

  async countMatchStatisticsByUserIdGroupByCircle(
    userId: UserId,
  ): Promise<CircleMatchStatisticsRow[]> {
    if (!deps) {
      throw new Error(
        "InMemoryMatchRepository requires circleSessionStore and circleStore for countMatchStatisticsByUserIdGroupByCircle",
      );
    }
    const circleMap = new Map<
      string,
      { circleName: string; stats: UserMatchStatistics }
    >();
    for (const m of matchStore.values()) {
      if (m.deletedAt !== null) continue;
      if (m.player1Id !== userId && m.player2Id !== userId) continue;
      if (m.outcome === "UNKNOWN") continue;

      const session = deps.circleSessionStore.get(m.circleSessionId);
      if (!session) continue;
      const circle = deps.circleStore.get(session.circleId);
      if (!circle) continue;

      let entry = circleMap.get(circle.id);
      if (!entry) {
        entry = {
          circleName: circle.name,
          stats: { wins: 0, losses: 0, draws: 0 },
        };
        circleMap.set(circle.id, entry);
      }
      accumulateStats(entry.stats, m.outcome, m.player1Id === userId);
    }

    return Array.from(circleMap.entries())
      .map(([cId, { circleName, stats }]) => ({
        circleId: cId as CircleId,
        circleName,
        ...stats,
      }))
      .sort((a, b) => a.circleName.localeCompare(b.circleName, "ja"));
  },

  async countMatchStatisticsByBothPlayerIds(
    userId: UserId,
    opponentId: UserId,
  ): Promise<UserMatchStatistics> {
    const stats: UserMatchStatistics = { wins: 0, losses: 0, draws: 0 };
    for (const m of matchStore.values()) {
      if (m.deletedAt !== null) continue;
      const isPair =
        (m.player1Id === userId && m.player2Id === opponentId) ||
        (m.player1Id === opponentId && m.player2Id === userId);
      if (!isPair) continue;
      accumulateStats(stats, m.outcome, m.player1Id === userId);
    }
    return stats;
  },

  async save(match: Match): Promise<void> {
    matchStore.set(match.id, { ...match });
  },
});
