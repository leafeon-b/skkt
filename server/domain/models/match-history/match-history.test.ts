import { describe, expect, test } from "vitest";
import { matchHistoryId, matchId, userId } from "@/server/domain/common/ids";
import { createMatchHistory } from "@/server/domain/models/match-history/match-history";

describe("MatchHistory ドメイン", () => {
  test("createMatchHistory は対局者の違いを検証する", () => {
    const history = createMatchHistory({
      id: matchHistoryId("history-1"),
      matchId: matchId("match-1"),
      editorId: userId("user-3"),
      action: "CREATE",
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "UNKNOWN",
    });

    expect(history.action).toBe("CREATE");
    expect(history.createdAt).toBeInstanceOf(Date);
  });

  test("createMatchHistory は同一対局者を拒否する", () => {
    expect(() =>
      createMatchHistory({
        id: matchHistoryId("history-1"),
        matchId: matchId("match-1"),
        editorId: userId("user-3"),
        action: "CREATE",
        player1Id: userId("user-1"),
        player2Id: userId("user-1"),
        outcome: "UNKNOWN",
      }),
    ).toThrow("players must be different");
  });

  test("createMatchHistory は不正な createdAt を拒否する", () => {
    expect(() =>
      createMatchHistory({
        id: matchHistoryId("history-1"),
        matchId: matchId("match-1"),
        editorId: userId("user-3"),
        action: "CREATE",
        createdAt: new Date("invalid"),
        player1Id: userId("user-1"),
        player2Id: userId("user-2"),
        outcome: "UNKNOWN",
      }),
    ).toThrow("createdAt must be a valid date");
  });
});
