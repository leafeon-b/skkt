import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    match: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import type { Match as PrismaMatch } from "@/generated/prisma/client";
import { prisma } from "@/server/infrastructure/db";
import { circleSessionId, matchId, userId } from "@/server/domain/common/ids";
import { createMatch } from "@/server/domain/models/match/match";
import { prismaMatchRepository } from "@/server/infrastructure/repository/match/prisma-match-repository";
import { mapMatchToPersistence } from "@/server/infrastructure/mappers/match-mapper";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma Match リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("findById は Match を返す", async () => {
    const prismaMatch = {
      id: "match-1",
      circleSessionId: "session-1",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "P1_WIN",
      deletedAt: null,
    } as PrismaMatch;

    mockedPrisma.match.findUnique.mockResolvedValueOnce(prismaMatch);

    const match = await prismaMatchRepository.findById(matchId("match-1"));

    expect(mockedPrisma.match.findUnique).toHaveBeenCalledWith({
      where: { id: "match-1" },
    });
    expect(match?.id).toBe("match-1");
  });

  test("findById は未取得時に null を返す", async () => {
    mockedPrisma.match.findUnique.mockResolvedValueOnce(null);

    const match = await prismaMatchRepository.findById(matchId("match-1"));

    expect(match).toBeNull();
  });

  test("listByCircleSessionId は対局結果一覧を返す", async () => {
    const prismaMatch = {
      id: "match-1",
      circleSessionId: "session-1",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "P1_WIN",
      deletedAt: null,
    } as PrismaMatch;

    mockedPrisma.match.findMany.mockResolvedValueOnce([prismaMatch]);

    const matches = await prismaMatchRepository.listByCircleSessionId(
      circleSessionId("session-1"),
    );

    expect(mockedPrisma.match.findMany).toHaveBeenCalledWith({
      where: { circleSessionId: "session-1" },
      orderBy: { createdAt: "asc" },
    });
    expect(matches).toHaveLength(1);
  });

  test("save は upsert を呼ぶ", async () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P2_WIN",
    });

    const data = mapMatchToPersistence(match);

    await prismaMatchRepository.save(match);

    expect(mockedPrisma.match.upsert).toHaveBeenCalledWith({
      where: { id: data.id },
      update: {
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        outcome: data.outcome,
        deletedAt: data.deletedAt,
      },
      create: data,
    });
  });
});
