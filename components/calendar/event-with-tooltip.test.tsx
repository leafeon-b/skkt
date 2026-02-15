// @vitest-environment jsdom
import type { EventContentArg } from "@fullcalendar/core";
import type { EventImpl } from "@fullcalendar/core/internal";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EventWithTooltip, formatTooltipDateTime } from "./session-calendar";

afterEach(() => {
  cleanup();
});

function buildArg(
  overrides: {
    title?: string;
    startsAt?: string | Date;
    endsAt?: string | Date;
  } = {},
): { arg: EventContentArg } {
  const title = overrides.title ?? "月例会";
  const event = {
    title,
    extendedProps: {
      startsAt: overrides.startsAt ?? "2025-01-15T14:00:00",
      endsAt: overrides.endsAt ?? "2025-01-15T16:00:00",
    },
  } as unknown as EventImpl;

  return {
    arg: { event } as unknown as EventContentArg,
  };
}

describe("EventWithTooltip", () => {
  it("sr-only スパンにカンマ区切りの日時テキストを含む", () => {
    render(<EventWithTooltip {...buildArg()} />);

    const srOnly = screen.getByText(/2025\/01\/15/);
    expect(srOnly.className).toContain("sr-only");
    expect(srOnly.textContent).toBe(", 2025/01/15 14:00 - 16:00");
  });

  it("aria-label 属性を使用しない", () => {
    render(<EventWithTooltip {...buildArg()} />);

    const trigger = screen.getByText("月例会");
    expect(trigger.closest("[aria-label]")).toBeNull();
  });

  it("日時データがない場合 sr-only スパンを含まない", () => {
    const arg = {
      arg: {
        event: {
          title: "テスト",
          extendedProps: {},
        } as unknown as EventImpl,
      } as unknown as EventContentArg,
    };

    render(<EventWithTooltip {...arg} />);

    expect(screen.queryByText(/\d{4}\/\d{2}\/\d{2}/)).toBeNull();
  });

  it("Date 型の startsAt / endsAt で正しくレンダリングされる", () => {
    render(
      <EventWithTooltip
        {...buildArg({
          startsAt: new Date(2025, 2, 10, 10, 0),
          endsAt: new Date(2025, 2, 10, 12, 30),
        })}
      />,
    );

    const srOnly = screen.getByText(/2025\/03\/10/);
    expect(srOnly.className).toContain("sr-only");
    expect(srOnly.textContent).toBe(", 2025/03/10 10:00 - 12:30");
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
