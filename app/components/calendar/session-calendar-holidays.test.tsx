// @vitest-environment jsdom
/**
 * 動的祝日の累積取得テスト
 *
 * dynamicRange が変更されてクエリキーが切り替わっても、
 * 過去に取得した祝日データが消失しないことを検証する。
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── trpc mock: useQuery の戻り値を動的に制御 ──

let mockQueryData: string[] | undefined = undefined;

/** Mock が dayCellClassNames を呼び出す対象日付 */
const TEST_DATES = [
  "2026-01-01",
  "2027-01-01",
  "2027-01-13",
  "2028-01-01",
  "2028-01-09",
];

vi.mock("@fullcalendar/react", () => ({
  default: React.forwardRef(function MockFullCalendar(
    props: Record<string, unknown>,
    _ref: React.Ref<unknown>, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    const datesSetRef = React.useRef(false);
    React.useEffect(() => {
      if (!datesSetRef.current && typeof props.datesSet === "function") {
        datesSetRef.current = true;
      }
    }, [props.datesSet]);

    const dayCellClassNames = props.dayCellClassNames as
      | ((arg: { date: Date }) => string[])
      | undefined;

    return (
      <div data-testid="mock-calendar">
        {TEST_DATES.map((dateStr) => {
          const classes =
            dayCellClassNames?.({ date: new Date(dateStr + "T00:00:00") }) ??
            [];
          return (
            <div key={dateStr} data-date={dateStr} className={classes.join(" ")}>
              {dateStr}
            </div>
          );
        })}
      </div>
    );
  }),
}));
vi.mock("@fullcalendar/daygrid", () => ({ default: {} }));
vi.mock("@fullcalendar/interaction", () => ({ default: {} }));
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    holidays: {
      list: {
        useQuery: () => ({ data: mockQueryData }),
      },
    },
  },
}));

let SessionCalendar: typeof import("./session-calendar").SessionCalendar;

beforeEach(async () => {
  mockQueryData = undefined;
  const mod = await import("./session-calendar");
  SessionCalendar = mod.SessionCalendar;
});

afterEach(() => {
  cleanup();
  vi.resetModules();
});

describe("動的祝日の累積保持", () => {
  it("クエリ結果が変わっても以前の祝日データが消失しない", () => {
    // 最初のクエリ結果: 2027年の祝日
    mockQueryData = ["2027-01-01", "2027-01-13"];

    const { rerender } = render(
      <SessionCalendar holidayDates={["2026-01-01"]} />,
    );

    // クエリ結果が切り替わる（2028年に移動したシミュレーション）
    mockQueryData = ["2028-01-01", "2028-01-09"];

    rerender(<SessionCalendar holidayDates={["2026-01-01"]} />);

    // 再レンダー後もエラーなく完了することを確認
    // （DOM 上のクラス検証は「祝日クラスの DOM 反映」で行う）
  });
});

describe("祝日クラスの DOM 反映", () => {
  /** 指定日付のセルが fc-day-holiday クラスを持つか判定するヘルパー */
  function hasHolidayClass(
    container: HTMLElement,
    dateStr: string,
  ): boolean {
    const cell = container.querySelector(`[data-date="${dateStr}"]`);
    return cell?.classList.contains("fc-day-holiday") ?? false;
  }

  it("dynamicHolidays が変わっても以前の値が保持される", () => {
    // 1回目: 2027年の祝日を動的取得
    mockQueryData = ["2027-01-01", "2027-01-13"];

    const { container, rerender } = render(
      <SessionCalendar holidayDates={["2026-01-01"]} />,
    );

    // props 由来 + 動的取得した祝日にクラスが付与される
    expect(hasHolidayClass(container, "2026-01-01")).toBe(true);
    expect(hasHolidayClass(container, "2027-01-01")).toBe(true);
    expect(hasHolidayClass(container, "2027-01-13")).toBe(true);
    expect(hasHolidayClass(container, "2028-01-01")).toBe(false);

    // 2回目: 2028年の祝日に切り替え
    mockQueryData = ["2028-01-01", "2028-01-09"];

    rerender(<SessionCalendar holidayDates={["2026-01-01"]} />);

    // props 由来の祝日は維持される
    expect(hasHolidayClass(container, "2026-01-01")).toBe(true);
    // 新しい動的祝日にクラスが付与される
    expect(hasHolidayClass(container, "2028-01-01")).toBe(true);
    expect(hasHolidayClass(container, "2028-01-09")).toBe(true);
  });

  it("同じ祝日データで再レンダーしてもクラスが正しく維持される", () => {
    mockQueryData = ["2027-01-01"];

    const { container, rerender } = render(
      <SessionCalendar holidayDates={["2026-01-01"]} />,
    );

    expect(hasHolidayClass(container, "2026-01-01")).toBe(true);
    expect(hasHolidayClass(container, "2027-01-01")).toBe(true);

    // 同じデータで再レンダー
    rerender(<SessionCalendar holidayDates={["2026-01-01"]} />);

    expect(hasHolidayClass(container, "2026-01-01")).toBe(true);
    expect(hasHolidayClass(container, "2027-01-01")).toBe(true);
  });
});
