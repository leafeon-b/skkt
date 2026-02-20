import { describe, expect, it } from "vitest";
import { getHolidayDateStrings } from "./japanese-holidays.server";

describe("getHolidayDateStrings", () => {
  it("元日（1月1日）を含む", () => {
    const result = getHolidayDateStrings(
      new Date(2026, 0, 1),
      new Date(2026, 0, 31),
    );
    expect(result).toContain("2026-01-01");
  });

  it("建国記念の日（2月11日）を含む", () => {
    const result = getHolidayDateStrings(
      new Date(2026, 1, 1),
      new Date(2026, 1, 28),
    );
    expect(result).toContain("2026-02-11");
  });

  it("平日のみの期間は空配列を返す", () => {
    // 2026-02-16（月）〜2026-02-20（金）は祝日なし
    const result = getHolidayDateStrings(
      new Date(2026, 1, 16),
      new Date(2026, 1, 20),
    );
    expect(result).toEqual([]);
  });

  it("振替休日を含む", () => {
    // 2025-02-24 は天皇誕生日(2/23 日曜)の振替休日
    const result = getHolidayDateStrings(
      new Date(2025, 1, 1),
      new Date(2025, 1, 28),
    );
    expect(result).toContain("2025-02-24");
  });

  it("YYYY-MM-DD 形式で返す", () => {
    const result = getHolidayDateStrings(
      new Date(2026, 0, 1),
      new Date(2026, 0, 1),
    );
    for (const dateStr of result) {
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
