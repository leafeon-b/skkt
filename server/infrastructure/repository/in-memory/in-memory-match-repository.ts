import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { Match } from "@/server/domain/models/match/match";
import type { MatchWithCircle } from "@/server/domain/models/match/match-read-models";
import type {
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionStore } from "./in-memory-circle-session-repository";
import type { CircleStore } from "./in-memory-circle-repository";

export type MatchStore = Map<string, Match>;

export const createInMemoryMatchRepository = (
  matchStore: MatchStore = new Map(),
  deps?: {
    circleSessionStore: CircleSessionStore;
    circleStore: CircleStore;
  },
): MatchRepository & { readonly _store: MatchStore } => ({
  _store: matchStore,

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

  async listByPlayerIdWithCircle(
    playerId: UserId,
  ): Promise<MatchWithCircle[]> {
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

  async save(match: Match): Promise<void> {
    matchStore.set(match.id, { ...match });
  },
});
