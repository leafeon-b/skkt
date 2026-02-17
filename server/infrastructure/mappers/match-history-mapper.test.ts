import { describe, expect, test } from "vitest";
import type { MatchHistory as PrismaMatchHistory } from "@/generated/prisma/client";
import {
  mapMatchHistoryToDomain,
  mapMatchHistoryToPersistence,
} from "@/server/infrastructure/mappers/match-history-mapper";
import { matchHistoryId, matchId, userId } from "@/server/domain/common/ids";
import { createMatchHistory } from "@/server/domain/models/match-history/match-history";

describe("MatchHistory マッパー", () => {
  test("Prisma MatchHistory をドメインに変換できる", () => {
    const prismaHistory: PrismaMatchHistory = {
      id: "history-1",
      matchId: "match-1",
      editorId: "user-3",
      action: "CREATE",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "UNKNOWN",
    };

    const history = mapMatchHistoryToDomain(prismaHistory);

    expect(history.id).toBe("history-1");
    expect(history.editorId).toBe("user-3");
    expect(history.action).toBe("CREATE");
  });

  test("ドメイン MatchHistory を永続化モデルに変換できる", () => {
    const history = createMatchHistory({
      id: matchHistoryId("history-1"),
      matchId: matchId("match-1"),
      editorId: userId("user-3"),
      action: "CREATE",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "UNKNOWN",
    });

    const mapped = mapMatchHistoryToPersistence(history);

    expect(mapped).toEqual({
      id: "history-1",
      matchId: "match-1",
      editorId: "user-3",
      action: "CREATE",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "UNKNOWN",
    });
  });
});
