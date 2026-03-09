import type { CircleSessionMatch } from "@/server/presentation/view-models/circle-session-detail";
import { describe, expect, it } from "vitest";

import {
  convertRowOutcomeToApiOutcome,
  getMatchOutcome,
  getNameInitial,
  getOutcomeLabel,
  getPairMatches,
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

describe("getNameInitial", () => {
  it("通常の名前から先頭1文字を返す", () => {
    expect(getNameInitial("田中")).toBe("田");
  });

  it("半角英字の名前から先頭1文字を返す", () => {
    expect(getNameInitial("Alice")).toBe("A");
  });

  it("前後に空白がある名前はトリムしてから先頭1文字を返す", () => {
    expect(getNameInitial(" 田中 ")).toBe("田");
  });

  it("空文字の場合は空文字を返す", () => {
    expect(getNameInitial("")).toBe("");
  });

  it("空白のみの場合は空文字を返す", () => {
    expect(getNameInitial("   ")).toBe("");
  });

  it("サロゲートペア（絵文字）を含む名前から先頭1文字を正しく返す", () => {
    expect(getNameInitial("🎯テスト")).toBe("🎯");
  });
});

describe("getOutcomeLabel", () => {
  it("ROW_WINの場合、行プレイヤー名を含む勝ちラベルを返す", () => {
    expect(getOutcomeLabel("ROW_WIN", "田中", "鈴木")).toBe("田中の勝ち");
  });

  it("ROW_LOSSの場合、列プレイヤー名を含む勝ちラベルを返す", () => {
    expect(getOutcomeLabel("ROW_LOSS", "田中", "鈴木")).toBe("鈴木の勝ち");
  });

  it("DRAWの場合、引き分けを返す", () => {
    expect(getOutcomeLabel("DRAW", "田中", "鈴木")).toBe("引き分け");
  });

  it("UNKNOWNの場合、未記録を返す", () => {
    expect(getOutcomeLabel("UNKNOWN", "田中", "鈴木")).toBe("未記録");
  });
});

describe("getMatchOutcome", () => {
  it("行プレイヤーが勝ちの場合、勝ちの表示情報を返す", () => {
    const result = getMatchOutcome("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "P1_WIN",
    });
    expect(result).toEqual({
      label: "○",
      className: "bg-(--brand-moss)/20 text-(--brand-ink)",
      title: "勝ち",
      kind: "win",
    });
  });

  it("行プレイヤーが負けの場合、負けの表示情報を返す", () => {
    const result = getMatchOutcome("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "P2_WIN",
    });
    expect(result).toEqual({
      label: "●",
      className: "bg-(--brand-ink)/10 text-(--brand-ink)",
      title: "負け",
      kind: "loss",
    });
  });

  it("行プレイヤーがplayer2側で勝ちの場合、勝ちの表示情報を返す", () => {
    const result = getMatchOutcome("p2", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "P2_WIN",
    });
    expect(result).toEqual({
      label: "○",
      className: "bg-(--brand-moss)/20 text-(--brand-ink)",
      title: "勝ち",
      kind: "win",
    });
  });

  it("引き分けの場合、引き分けの表示情報を返す", () => {
    const result = getMatchOutcome("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "DRAW",
    });
    expect(result).toEqual({
      label: "△",
      className: "bg-(--brand-gold)/20 text-(--brand-ink)",
      title: "引き分け",
      kind: "draw",
    });
  });

  it("未記録の場合、未記録の表示情報を返す", () => {
    const result = getMatchOutcome("p1", {
      player1Id: "p1",
      player2Id: "p2",
      outcome: "UNKNOWN",
    });
    expect(result).toEqual({
      label: "未",
      className: "bg-white/70 text-(--brand-ink-muted)",
      title: "未記録",
      kind: "unknown",
    });
  });
});

describe("getPairMatches", () => {
  const makeMatch = (
    id: string,
    player1Id: string,
    player2Id: string,
  ): CircleSessionMatch => ({
    id,
    player1Id,
    player2Id,
    outcome: "UNKNOWN",
    createdAtInput: "2026-01-01",
  });

  it("指定ペア間の対局のみを抽出する（player1/player2の順序に依存しない）", () => {
    const matches = [
      makeMatch("m1", "p1", "p2"),
      makeMatch("m2", "p2", "p1"),
    ];
    const result = getPairMatches(matches, "p1", "p2");
    expect(result).toEqual([
      { match: matches[0], index: 0 },
      { match: matches[1], index: 1 },
    ]);
  });

  it("該当する対局がない場合、空配列を返す", () => {
    const matches = [makeMatch("m1", "p1", "p2")];
    const result = getPairMatches(matches, "p1", "p3");
    expect(result).toEqual([]);
  });

  it("複数の対局がある場合、すべて抽出し元のインデックスを保持する", () => {
    const matches = [
      makeMatch("m1", "p3", "p4"),
      makeMatch("m2", "p1", "p2"),
      makeMatch("m3", "p3", "p4"),
      makeMatch("m4", "p2", "p1"),
    ];
    const result = getPairMatches(matches, "p1", "p2");
    expect(result).toEqual([
      { match: matches[1], index: 1 },
      { match: matches[3], index: 3 },
    ]);
  });

  it("関係ないプレイヤーの対局は含まれない", () => {
    const matches = [
      makeMatch("m1", "p1", "p2"),
      makeMatch("m2", "p3", "p4"),
      makeMatch("m3", "p1", "p3"),
    ];
    const result = getPairMatches(matches, "p1", "p2");
    expect(result).toEqual([{ match: matches[0], index: 0 }]);
  });
});
