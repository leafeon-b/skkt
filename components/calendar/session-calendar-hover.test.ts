import { describe, expect, it } from "vitest";
import { buildSessionDates, getDayCellClassNames } from "./session-calendar";

describe("buildSessionDates", () => {
  it("events が undefined → 空 Set を返す", () => {
    const result = buildSessionDates(undefined);
    expect(result.size).toBe(0);
  });

  it("events が空配列 → 空 Set を返す", () => {
    const result = buildSessionDates([]);
    expect(result.size).toBe(0);
  });

  it("start が Date オブジェクト → toISOString().slice(0, 10) で日付文字列を生成", () => {
    const result = buildSessionDates([{ start: new Date(2025, 0, 15, 14, 0) }]);
    expect(result.has("2025-01-15")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("start が ISO文字列 → .slice(0, 10) で日付文字列を生成", () => {
    const result = buildSessionDates([{ start: "2025-03-10T09:00:00" }]);
    expect(result.has("2025-03-10")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("複数イベント → すべての日付を含む Set を返す", () => {
    const result = buildSessionDates([
      { start: "2025-01-15T14:00:00" },
      { start: new Date(2025, 2, 10, 10, 0) },
      { start: "2025-06-01T09:00:00" },
    ]);
    expect(result.size).toBe(3);
    expect(result.has("2025-01-15")).toBe(true);
    expect(result.has("2025-03-10")).toBe(true);
    expect(result.has("2025-06-01")).toBe(true);
  });

  it("start が Date でも string でもない → 空文字列がセットに含まれる", () => {
    const result = buildSessionDates([{ start: 12345 as unknown as string }]);
    expect(result.has("")).toBe(true);
    expect(result.size).toBe(1);
  });
});

describe("getDayCellClassNames", () => {
  it("hasDateClick が false + 平日 → 空配列を返す", () => {
    const sessionDates = new Set(["2025-01-15"]);
    // 2025-01-15 は平日（水曜）
    const result = getDayCellClassNames(
      new Date(2025, 0, 15),
      "2025-01-15",
      sessionDates,
      false,
    );
    expect(result).toEqual([]);
  });

  it("hasDateClick が true + sessionDates にその日付が含まれる + 平日 → 空配列を返す", () => {
    const sessionDates = new Set(["2025-01-15"]);
    const result = getDayCellClassNames(
      new Date(2025, 0, 15),
      "2025-01-15",
      sessionDates,
      true,
    );
    expect(result).toEqual([]);
  });

  it("hasDateClick が true + sessionDates にその日付が含まれない + 平日 → ['fc-day-clickable']", () => {
    const sessionDates = new Set(["2025-01-15"]);
    // 2025-02-03 は月曜
    const result = getDayCellClassNames(
      new Date(2025, 1, 3),
      "2025-02-03",
      sessionDates,
      true,
    );
    expect(result).toEqual(["fc-day-clickable"]);
  });

  it("祝日の場合 → fc-day-holiday クラスを含む", () => {
    const sessionDates = new Set<string>();
    // 2026-01-01 は元日（祝日）
    const result = getDayCellClassNames(
      new Date(2026, 0, 1),
      "2026-01-01",
      sessionDates,
      false,
    );
    expect(result).toContain("fc-day-holiday");
  });

  it("祝日 + hasDateClick + セッションなし → fc-day-clickable と fc-day-holiday の両方", () => {
    const sessionDates = new Set<string>();
    // 2026-02-11 は建国記念の日（祝日）
    const result = getDayCellClassNames(
      new Date(2026, 1, 11),
      "2026-02-11",
      sessionDates,
      true,
    );
    expect(result).toContain("fc-day-clickable");
    expect(result).toContain("fc-day-holiday");
  });

  it("平日（祝日でない） → fc-day-holiday を含まない", () => {
    const sessionDates = new Set<string>();
    // 2026-02-20 は平日
    const result = getDayCellClassNames(
      new Date(2026, 1, 20),
      "2026-02-20",
      sessionDates,
      false,
    );
    expect(result).not.toContain("fc-day-holiday");
  });
});
