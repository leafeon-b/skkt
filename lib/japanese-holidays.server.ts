import holiday_jp from "@holiday-jp/holiday_jp";

/**
 * 指定期間内の日本の祝日を "YYYY-MM-DD" 形式の文字列配列で返す（サーバー専用）
 */
export function getHolidayDateStrings(start: Date, end: Date): string[] {
  const holidays = holiday_jp.between(start, end);
  return holidays.map((h) => {
    const d = h.date;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
}

/**
 * 現在年 ± offsetYears 年分の祝日を返す（Provider 用ヘルパー）
 */
export function getHolidayDateStringsForRange(offsetYears = 1): string[] {
  const now = new Date();
  const start = new Date(now.getFullYear() - offsetYears, 0, 1);
  const end = new Date(now.getFullYear() + offsetYears, 11, 31);
  return getHolidayDateStrings(start, end);
}
