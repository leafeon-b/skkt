import { describe, expect, test } from "vitest";
import {
  assertCanRemoveCircleSessionParticipation,
  hasMatchParticipation,
} from "@/server/domain/services/circle-session/participation";
import { circleSessionId, matchId, userId } from "@/server/domain/common/ids";
import { createMatch } from "@/server/domain/models/match/match";

const baseMatch = () =>
  createMatch({
    id: matchId("match-1"),
    circleSessionId: circleSessionId("session-1"),
    order: 1,
    player1Id: userId("user-1"),
    player2Id: userId("user-2"),
    outcome: "P1_WIN",
  });

describe("開催回参加取消の不変条件", () => {
  test("対局が0件なら参加者を削除できる", () => {
    expect(() =>
      assertCanRemoveCircleSessionParticipation([], userId("user-1")),
    ).not.toThrow();
  });

  test("対局に登場する参加者は削除できない", () => {
    const matches = [baseMatch()];

    expect(() =>
      assertCanRemoveCircleSessionParticipation(matches, userId("user-1")),
    ).toThrow("Participation cannot be removed because matches exist");
  });

  test("対局に登場しない参加者は削除できる", () => {
    const matches = [baseMatch()];

    expect(() =>
      assertCanRemoveCircleSessionParticipation(matches, userId("user-3")),
    ).not.toThrow();
  });

  test("論理削除の対局でも参加者の削除を拒否する", () => {
    const deletedMatch = {
      ...baseMatch(),
      deletedAt: new Date("2024-01-01T00:00:00Z"),
    };

    expect(() =>
      assertCanRemoveCircleSessionParticipation([deletedMatch], userId("user-2")),
    ).toThrow("Participation cannot be removed because matches exist");
  });

  test("hasMatchParticipation は対局参加の有無を判定できる", () => {
    const matches = [baseMatch()];

    expect(hasMatchParticipation(matches, userId("user-1"))).toBe(true);
    expect(hasMatchParticipation(matches, userId("user-3"))).toBe(false);
  });
});
