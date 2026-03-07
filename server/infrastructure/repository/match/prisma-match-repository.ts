import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapMatchToDomain,
  mapMatchToPersistence,
} from "@/server/infrastructure/mappers/match-mapper";
import type { Match } from "@/server/domain/models/match/match";
import type { MatchWithCircle } from "@/server/domain/models/match/match-read-models";
import type {
  CircleSessionId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const createPrismaMatchRepository = (
  client: PrismaClientLike,
): MatchRepository => ({
  async findById(id: MatchId): Promise<Match | null> {
    const found = await client.match.findUnique({
      where: { id: toPersistenceId(id) },
    });

    return found ? mapMatchToDomain(found) : null;
  },

  async listByCircleSessionId(
    circleSessionId: CircleSessionId,
  ): Promise<Match[]> {
    const matches = await client.match.findMany({
      where: { circleSessionId: toPersistenceId(circleSessionId) },
      orderBy: { createdAt: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async listByPlayerId(playerId: UserId): Promise<Match[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          { player1Id: toPersistenceId(playerId) },
          { player2Id: toPersistenceId(playerId) },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async listByBothPlayerIds(
    playerId: UserId,
    opponentId: UserId,
  ): Promise<Match[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            player1Id: toPersistenceId(playerId),
            player2Id: toPersistenceId(opponentId),
          },
          {
            player1Id: toPersistenceId(opponentId),
            player2Id: toPersistenceId(playerId),
          },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async listByPlayerIdWithCircle(playerId: UserId): Promise<MatchWithCircle[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          { player1Id: toPersistenceId(playerId) },
          { player2Id: toPersistenceId(playerId) },
        ],
      },
      include: {
        session: {
          include: {
            circle: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return matches.map((m) => ({
      ...mapMatchToDomain(m),
      circleId: toCircleId(m.session.circleId),
      circleName: m.session.circle.name,
    }));
  },

  async listDistinctOpponentIds(playerId: UserId): Promise<UserId[]> {
    const pid = toPersistenceId(playerId);

    const [asPlayer1, asPlayer2] = await Promise.all([
      client.match.findMany({
        where: { player1Id: pid, deletedAt: null },
        select: { player2Id: true },
        distinct: ["player2Id"],
      }),
      client.match.findMany({
        where: { player2Id: pid, deletedAt: null },
        select: { player1Id: true },
        distinct: ["player1Id"],
      }),
    ]);

    const ids = new Set<string>();
    for (const m of asPlayer1) ids.add(m.player2Id);
    for (const m of asPlayer2) ids.add(m.player1Id);

    return [...ids].map(toUserId);
  },

  async save(match: Match): Promise<void> {
    const data = mapMatchToPersistence(match);

    await client.match.upsert({
      where: { id: data.id },
      update: {
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        outcome: data.outcome,
        deletedAt: data.deletedAt,
      },
      create: data,
    });
  },
});

export const prismaMatchRepository = createPrismaMatchRepository(prisma);
