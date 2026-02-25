import { describe, expect, test } from "vitest";
import { classifyOutcomeForUser } from "@/server/application/match/match-outcome";

describe("classifyOutcomeForUser", () => {
  test("P1_WIN でプレイヤー1の場合 win を返す", () => {
    expect(classifyOutcomeForUser("P1_WIN", true)).toBe("win");
  });

  test("P1_WIN でプレイヤー2の場合 loss を返す", () => {
    expect(classifyOutcomeForUser("P1_WIN", false)).toBe("loss");
  });

  test("P2_WIN でプレイヤー1の場合 loss を返す", () => {
    expect(classifyOutcomeForUser("P2_WIN", true)).toBe("loss");
  });

  test("P2_WIN でプレイヤー2の場合 win を返す", () => {
    expect(classifyOutcomeForUser("P2_WIN", false)).toBe("win");
  });

  test("DRAW でプレイヤー1の場合 draw を返す", () => {
    expect(classifyOutcomeForUser("DRAW", true)).toBe("draw");
  });

  test("DRAW でプレイヤー2の場合 draw を返す", () => {
    expect(classifyOutcomeForUser("DRAW", false)).toBe("draw");
  });

  test("UNKNOWN でプレイヤー1の場合 null を返す", () => {
    expect(classifyOutcomeForUser("UNKNOWN", true)).toBeNull();
  });

  test("UNKNOWN でプレイヤー2の場合 null を返す", () => {
    expect(classifyOutcomeForUser("UNKNOWN", false)).toBeNull();
  });
});
