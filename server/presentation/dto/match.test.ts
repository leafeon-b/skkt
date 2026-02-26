import { describe, expect, test } from "vitest";
import {
  matchCreateInputSchema,
  matchUpdateInputSchema,
} from "@/server/presentation/dto/match";

describe("matchCreateInputSchema", () => {
  const validBase = {
    circleSessionId: "session-1",
    player1Id: "user-1",
    player2Id: "user-2",
    outcome: "P1_WIN" as const,
  };

  test("異なるプレイヤーIDでパースが成功する", () => {
    const result = matchCreateInputSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  test("同一プレイヤーIDはバリデーションエラーになる", () => {
    const result = matchCreateInputSchema.safeParse({
      ...validBase,
      player1Id: "user-1",
      player2Id: "user-1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "player1Id and player2Id must be different",
      );
      expect(result.error.issues[0].path).toContain("player2Id");
    }
  });
});

describe("matchUpdateInputSchema", () => {
  const updateBase = {
    matchId: "match-1",
  };

  test("両方のプレイヤーIDが異なる場合はパースが成功する", () => {
    const result = matchUpdateInputSchema.safeParse({
      ...updateBase,
      player1Id: "user-1",
      player2Id: "user-2",
    });
    expect(result.success).toBe(true);
  });

  test("両方のプレイヤーIDが同一の場合はバリデーションエラーになる", () => {
    const result = matchUpdateInputSchema.safeParse({
      ...updateBase,
      player1Id: "user-1",
      player2Id: "user-1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const samePlayerIssue = result.error.issues.find(
        (i) => i.message === "player1Id and player2Id must be different",
      );
      expect(samePlayerIssue).toBeDefined();
      expect(samePlayerIssue!.path).toContain("player2Id");
    }
  });

  test("プレイヤーIDが両方未指定の場合はパースが成功する", () => {
    const result = matchUpdateInputSchema.safeParse(updateBase);
    expect(result.success).toBe(true);
  });

  test("player1Idのみ指定はバリデーションエラーになる", () => {
    const result = matchUpdateInputSchema.safeParse({
      ...updateBase,
      player1Id: "user-1",
    });
    expect(result.success).toBe(false);
  });

  test("player2Idのみ指定はバリデーションエラーになる", () => {
    const result = matchUpdateInputSchema.safeParse({
      ...updateBase,
      player2Id: "user-2",
    });
    expect(result.success).toBe(false);
  });
});
