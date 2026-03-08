import { describe, expect, it } from "vitest";

import {
  convertRowOutcomeToApiOutcome,
  getRowOutcomeValue,
  type RowOutcome,
} from "../match-utils";

describe("convertRowOutcomeToApiOutcome", () => {
  it("ROW_WIN + rowがplayer1 → P1_WIN を返す", () => {
    expect(convertRowOutcomeToApiOutcome("ROW_WIN", "p1", "p1")).toBe("P1_WIN");
  });

  it("ROW_WIN + rowがplayer2 → P2_WIN を返す", () => {
    expect(convertRowOutcomeToApiOutcome("ROW_WIN", "p2", "p1")).toBe("P2_WIN");
  });

  it("ROW_LOSS + rowがplayer1 → P2_WIN を返す", () => {
    expect(convertRowOutcomeToApiOutcome("ROW_LOSS", "p1", "p1")).toBe(
      "P2_WIN",
    );
  });

  it("ROW_LOSS + rowがplayer2 → P1_WIN を返す", () => {
    expect(convertRowOutcomeToApiOutcome("ROW_LOSS", "p2", "p1")).toBe(
      "P1_WIN",
    );
  });

  it("DRAW → DRAW を返す", () => {
    expect(convertRowOutcomeToApiOutcome("DRAW", "p1", "p1")).toBe("DRAW");
  });

  it("UNKNOWN → UNKNOWN を返す", () => {
    expect(convertRowOutcomeToApiOutcome("UNKNOWN", "p1", "p1")).toBe(
      "UNKNOWN",
    );
  });
});

describe("getRowOutcomeValue", () => {
  it("P1_WIN + rowがplayer1 → ROW_WIN を返す", () => {
    const result = getRowOutcomeValue("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "P1_WIN",
    });
    expect(result).toBe("ROW_WIN");
  });

  it("P1_WIN + rowがplayer2 → ROW_LOSS を返す", () => {
    const result = getRowOutcomeValue("p2", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "P1_WIN",
    });
    expect(result).toBe("ROW_LOSS");
  });

  it("P2_WIN + rowがplayer1 → ROW_LOSS を返す", () => {
    const result = getRowOutcomeValue("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "P2_WIN",
    });
    expect(result).toBe("ROW_LOSS");
  });

  it("P2_WIN + rowがplayer2 → ROW_WIN を返す", () => {
    const result = getRowOutcomeValue("p2", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "P2_WIN",
    });
    expect(result).toBe("ROW_WIN");
  });

  it("DRAW → DRAW を返す", () => {
    const result = getRowOutcomeValue("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "DRAW",
    });
    expect(result).toBe("DRAW");
  });

  it("UNKNOWN → UNKNOWN を返す", () => {
    const result = getRowOutcomeValue("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "UNKNOWN",
    });
    expect(result).toBe("UNKNOWN");
  });
});

describe("双方向変換の対称性", () => {
  const cases: { rowOutcome: RowOutcome; rowId: string; player1Id: string }[] = [
    { rowOutcome: "ROW_WIN", rowId: "p1", player1Id: "p1" },
    { rowOutcome: "ROW_WIN", rowId: "p2", player1Id: "p1" },
    { rowOutcome: "ROW_LOSS", rowId: "p1", player1Id: "p1" },
    { rowOutcome: "ROW_LOSS", rowId: "p2", player1Id: "p1" },
    { rowOutcome: "DRAW", rowId: "p1", player1Id: "p1" },
    { rowOutcome: "UNKNOWN", rowId: "p1", player1Id: "p1" },
  ];

  it.each(cases)(
    "convertRowOutcomeToApiOutcome → getRowOutcomeValue のラウンドトリップで $rowOutcome (row=$rowId) が復元される",
    ({ rowOutcome, rowId, player1Id }) => {
      const player2Id = rowId === player1Id ? "p2" : "p1";
      const apiOutcome = convertRowOutcomeToApiOutcome(
        rowOutcome,
        rowId,
        player1Id,
      );
      const restored = getRowOutcomeValue(rowId, {
        player1Id,
        player2Id,
        outcome: apiOutcome,
      });
      expect(restored).toBe(rowOutcome);
    },
  );
});
