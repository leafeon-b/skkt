import { describe, expect, test } from "vitest";
import type { Match as PrismaMatch } from "@/generated/prisma/client";
import {
  mapMatchToDomain,
  mapMatchToPersistence,
} from "@/server/infrastructure/mappers/match-mapper";
import { circleSessionId, matchId, userId } from "@/server/domain/common/ids";
import { createMatch } from "@/server/domain/models/match/match";

describe("Match マッパー", () => {
  test("Prisma Match をドメインに変換できる", () => {
    const prismaMatch: PrismaMatch = {
      id: "match-1",
      circleSessionId: "session-1",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "P1_WIN",
      deletedAt: null,
    };

    const match = mapMatchToDomain(prismaMatch);

    expect(match.id).toBe("match-1");
    expect(match.circleSessionId).toBe("session-1");
    expect(match.outcome).toBe("P1_WIN");
    expect(match.deletedAt).toBeNull();
  });

  test("ドメイン Match を永続化モデルに変換できる", () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P2_WIN",
    });

    const mapped = mapMatchToPersistence(match);

    expect(mapped).toEqual({
      id: "match-1",
      circleSessionId: "session-1",
      createdAt: expect.any(Date),
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "P2_WIN",
      deletedAt: null,
    });
  });
});
