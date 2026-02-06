import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import { prisma } from "@/server/infrastructure/db";
import {
  mapMatchToDomain,
  mapMatchToPersistence,
} from "@/server/infrastructure/mappers/match-mapper";
import type { Match } from "@/server/domain/models/match/match";
import type { CircleSessionId, MatchId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const prismaMatchRepository: MatchRepository = {
  async findById(id: MatchId): Promise<Match | null> {
    const found = await prisma.match.findUnique({
      where: { id: toPersistenceId(id) },
    });

    return found ? mapMatchToDomain(found) : null;
  },

  async listByCircleSessionId(
    circleSessionId: CircleSessionId,
  ): Promise<Match[]> {
    const matches = await prisma.match.findMany({
      where: { circleSessionId: toPersistenceId(circleSessionId) },
      orderBy: { order: "asc" },
    });

    return matches.map(mapMatchToDomain);
  },

  async save(match: Match): Promise<void> {
    const data = mapMatchToPersistence(match);

    await prisma.match.upsert({
      where: { id: data.id },
      update: {
        order: data.order,
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        outcome: data.outcome,
        deletedAt: data.deletedAt,
      },
      create: data,
    });
  },
};
