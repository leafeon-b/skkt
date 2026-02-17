import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    matchHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import type { MatchHistory as PrismaMatchHistory } from "@/generated/prisma/client";
import { prisma } from "@/server/infrastructure/db";
import { matchHistoryId, matchId, userId } from "@/server/domain/common/ids";
import { createMatchHistory } from "@/server/domain/models/match-history/match-history";
import { mapMatchHistoryToPersistence } from "@/server/infrastructure/mappers/match-history-mapper";
import { prismaMatchHistoryRepository } from "@/server/infrastructure/repository/match-history/prisma-match-history-repository";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma MatchHistory リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listByMatchId は履歴一覧を返す", async () => {
    const prismaHistory = {
      id: "history-1",
      matchId: "match-1",
      editorId: "user-1",
      action: "CREATE",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "UNKNOWN",
    } as PrismaMatchHistory;

    mockedPrisma.matchHistory.findMany.mockResolvedValueOnce([prismaHistory]);

    const histories = await prismaMatchHistoryRepository.listByMatchId(
      matchId("match-1"),
    );

    expect(mockedPrisma.matchHistory.findMany).toHaveBeenCalledWith({
      where: { matchId: "match-1" },
      orderBy: { createdAt: "asc" },
    });
    expect(histories).toHaveLength(1);
  });

  test("add は create を呼ぶ", async () => {
    const history = createMatchHistory({
      id: matchHistoryId("history-1"),
      matchId: matchId("match-1"),
      editorId: userId("user-1"),
      action: "CREATE",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "UNKNOWN",
    });

    const data = mapMatchHistoryToPersistence(history);

    await prismaMatchHistoryRepository.add(history);

    expect(mockedPrisma.matchHistory.create).toHaveBeenCalledWith({ data });
  });
});
