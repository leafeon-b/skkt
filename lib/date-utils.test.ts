import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatTime,
  formatDateTimeRange,
  formatDateForInput,
  formatDateTimeForInput,
  formatTooltipDateTime,
} from "./date-utils";

describe("formatDate", () => {
  it("YYYY/MM/DD 形式で返す", () => {
    expect(formatDate(new Date(2025, 0, 5))).toBe("2025/01/05");
  });

  it("月・日を2桁ゼロ埋めする", () => {
    expect(formatDate(new Date(2025, 11, 31))).toBe("2025/12/31");
  });
});

describe("formatTime", () => {
  it("HH:MM 形式で返す", () => {
    expect(formatTime(new Date(2025, 0, 1, 9, 5))).toBe("09:05");
  });

  it("時・分を2桁ゼロ埋めする", () => {
    expect(formatTime(new Date(2025, 0, 1, 14, 30))).toBe("14:30");
  });
});

describe("formatDateTimeRange", () => {
  it("日付と時間範囲を結合して返す", () => {
    const start = new Date(2025, 0, 15, 14, 0);
    const end = new Date(2025, 0, 15, 16, 30);
    expect(formatDateTimeRange(start, end)).toBe("2025/01/15 14:00 - 16:30");
  });
});

describe("formatDateForInput", () => {
  it("YYYY-MM-DD 形式で返す", () => {
    expect(formatDateForInput(new Date(2025, 0, 5))).toBe("2025-01-05");
  });

  it("月・日を2桁ゼロ埋めする", () => {
    expect(formatDateForInput(new Date(2025, 11, 31))).toBe("2025-12-31");
  });
});

describe("formatDateTimeForInput", () => {
  it("YYYY-MM-DDThh:mm 形式で返す", () => {
    expect(formatDateTimeForInput(new Date(2025, 0, 15, 9, 5))).toBe(
      "2025-01-15T09:05",
    );
  });
});

describe("formatTooltipDateTime", () => {
  it("string 型の日付入力で正しいフォーマットを返す", () => {
    const result = formatTooltipDateTime(
      "2025-06-01T09:00:00",
      "2025-06-01T11:30:00",
    );
    expect(result).toBe("2025/06/01 09:00 - 11:30");
  });

  it("Date 型の日付入力で正しいフォーマットを返す", () => {
    const result = formatTooltipDateTime(
      new Date(2025, 0, 15, 14, 0),
      new Date(2025, 0, 15, 16, 0),
    );
    expect(result).toBe("2025/01/15 14:00 - 16:00");
  });

  it("不正な日付文字列の場合 NaN を含む文字列を返す", () => {
    const result = formatTooltipDateTime("invalid-date", "also-invalid");
    expect(result).toContain("NaN");
  });
});
