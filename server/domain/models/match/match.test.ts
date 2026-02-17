import { describe, expect, test } from "vitest";
import { circleSessionId, matchId, userId } from "@/server/domain/common/ids";
import {
  createMatch,
  deleteMatch,
  hasDifferentPlayers,
  updateMatchOutcome,
  updateMatchPlayers,
  restoreMatch,
} from "@/server/domain/models/match/match";

describe("Match ドメイン", () => {
  test("createMatch は対局者の違いを検証する", () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
    });

    expect(match.outcome).toBe("UNKNOWN");
    expect(match.createdAt).toBeInstanceOf(Date);
  });

  test("createMatch は同一対局者を拒否する", () => {
    expect(() =>
      createMatch({
        id: matchId("match-1"),
        circleSessionId: circleSessionId("session-1"),
        player1Id: userId("user-1"),
        player2Id: userId("user-1"),
      }),
    ).toThrow("players must be different");
  });

  test("updateMatchPlayers は対局者を正しく更新する", () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
    });

    const updated = updateMatchPlayers(
      match,
      userId("user-3"),
      userId("user-4"),
    );

    expect(updated.player1Id).toBe(userId("user-3"));
    expect(updated.player2Id).toBe(userId("user-4"));
  });

  test("updateMatchPlayers は対局者の違いを検証する", () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
    });

    expect(() =>
      updateMatchPlayers(match, userId("user-1"), userId("user-1")),
    ).toThrow("players must be different");
  });

  test("updateMatchOutcome は結果を更新する", () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
    });

    const updated = updateMatchOutcome(match, "P1_WIN");
    expect(updated.outcome).toBe("P1_WIN");
  });

  test("deleteMatch は deletedAt を設定する", () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
    });

    const deletedAt = new Date("2024-01-01T00:00:00Z");
    const deleted = deleteMatch(match, deletedAt);
    expect(deleted.deletedAt?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  test("restoreMatch は deletedAt を含めて復元する", () => {
    const restored = restoreMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P2_WIN",
      deletedAt: new Date("2024-01-02T00:00:00Z"),
    });

    expect(restored.deletedAt?.toISOString()).toBe("2024-01-02T00:00:00.000Z");
    expect(restored.outcome).toBe("P2_WIN");
  });

  test("restoreMatch は deletedAt が null の場合に null を設定する", () => {
    const restored = restoreMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P1_WIN",
      deletedAt: null,
    });

    expect(restored.deletedAt).toBeNull();
  });

  test("restoreMatch は deletedAt が undefined の場合に null を設定する", () => {
    const restored = restoreMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P1_WIN",
      deletedAt: undefined,
    });

    expect(restored.deletedAt).toBeNull();
  });

  test("restoreMatch は不正な createdAt を拒否する", () => {
    expect(() =>
      restoreMatch({
        id: matchId("match-1"),
        circleSessionId: circleSessionId("session-1"),
        createdAt: new Date("invalid"),
        player1Id: userId("user-1"),
        player2Id: userId("user-2"),
        outcome: "P1_WIN",
      }),
    ).toThrow("createdAt must be a valid date");
  });

  test("deleteMatch は引数なしでデフォルトの日時を設定する", () => {
    const match = createMatch({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
    });

    const before = new Date();
    const deleted = deleteMatch(match);
    const after = new Date();

    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.deletedAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(deleted.deletedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  test("hasDifferentPlayers は異なるプレイヤーで true を返す", () => {
    expect(hasDifferentPlayers(userId("user-1"), userId("user-2"))).toBe(true);
  });

  test("hasDifferentPlayers は同一プレイヤーで false を返す", () => {
    expect(hasDifferentPlayers(userId("user-1"), userId("user-1"))).toBe(false);
  });
});
