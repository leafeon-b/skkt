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
  it("YYYY-MM-DD 形式（JST）で返す", () => {
    // 2025-01-05T10:00:00Z = 2025-01-05T19:00:00+09:00
    expect(formatDateForInput(new Date("2025-01-05T10:00:00Z"))).toBe(
      "2025-01-05",
    );
  });

  it("月・日を2桁ゼロ埋めする", () => {
    // 2025-12-31T00:00:00Z = 2025-12-31T09:00:00+09:00
    expect(formatDateForInput(new Date("2025-12-31T00:00:00Z"))).toBe(
      "2025-12-31",
    );
  });

  it("JST 深夜帯で日付がずれない（UTC では前日でも JST では当日）", () => {
    // 2025-01-14T15:30:00Z = 2025-01-15T00:30:00+09:00
    expect(formatDateForInput(new Date("2025-01-14T15:30:00Z"))).toBe(
      "2025-01-15",
    );
  });
});

describe("formatDateTimeForInput", () => {
  it("YYYY-MM-DDThh:mm 形式（JST）で返す", () => {
    // 2025-01-15T00:05:00Z = 2025-01-15T09:05:00+09:00
    expect(formatDateTimeForInput(new Date("2025-01-15T00:05:00Z"))).toBe(
      "2025-01-15T09:05",
    );
  });

  it("JST 深夜帯で日付・時刻がずれない", () => {
    // 2025-01-14T15:30:00Z = 2025-01-15T00:30:00+09:00
    expect(formatDateTimeForInput(new Date("2025-01-14T15:30:00Z"))).toBe(
      "2025-01-15T00:30",
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

  it("不正な日付文字列の場合、空文字列を返す", () => {
    const result = formatTooltipDateTime("invalid-date", "also-invalid");
    expect(result).toBe("");
  });

  it("開始日のみ不正な場合、空文字列を返す", () => {
    const result = formatTooltipDateTime("invalid-date", "2025-01-15T12:00:00");
    expect(result).toBe("");
  });

  it("終了日のみ不正な場合、空文字列を返す", () => {
    const result = formatTooltipDateTime("2025-01-15T10:00:00", "not-a-date");
    expect(result).toBe("");
  });

  it("不正なDateオブジェクトの場合、空文字列を返す", () => {
    const result = formatTooltipDateTime(
      new Date("invalid"),
      new Date("invalid"),
    );
    expect(result).toBe("");
  });
});
