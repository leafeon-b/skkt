import type { MatchHistoryRepository } from "@/server/domain/models/match-history/match-history-repository";
import { prisma } from "@/server/infrastructure/db";
import {
  mapMatchHistoryToDomain,
  mapMatchHistoryToPersistence,
} from "@/server/infrastructure/mappers/match-history-mapper";
import type { MatchHistory } from "@/server/domain/models/match-history/match-history";
import type { MatchId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const prismaMatchHistoryRepository: MatchHistoryRepository = {
  async listByMatchId(matchId: MatchId): Promise<MatchHistory[]> {
    const histories = await prisma.matchHistory.findMany({
      where: { matchId: toPersistenceId(matchId) },
      orderBy: { createdAt: "asc" },
    });

    return histories.map(mapMatchHistoryToDomain);
  },

  async add(history: MatchHistory): Promise<void> {
    const data = mapMatchHistoryToPersistence(history);

    await prisma.matchHistory.create({ data });
  },
};
