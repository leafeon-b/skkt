export type HolidayProvider = {
  /** 指定期間内の祝日を "YYYY-MM-DD" 形式の文字列配列で返す */
  getHolidayDateStrings(start: Date, end: Date): string[];
  /** 現在年 ± offsetYears 年分の祝日を返す */
  getHolidayDateStringsForRange(offsetYears?: number): string[];
};
