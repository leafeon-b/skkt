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
import { circleId } from "@/server/domain/common/ids";
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

  async listByUserId(userId: UserId): Promise<Match[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          { player1Id: toPersistenceId(userId) },
          { player2Id: toPersistenceId(userId) },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async listByUserIdWithCircle(
    userId: UserId,
  ): Promise<MatchWithCircle[]> {
    const matches = await client.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          { player1Id: toPersistenceId(userId) },
          { player2Id: toPersistenceId(userId) },
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
      circleId: circleId(m.session.circleId),
      circleName: m.session.circle.name,
    }));
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
