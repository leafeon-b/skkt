// @vitest-environment jsdom
import type { EventContentArg } from "@fullcalendar/core";
import type { EventImpl } from "@fullcalendar/core/internal";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EventWithTooltip } from "./session-calendar";

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
      startsAt: overrides.startsAt ?? "2025-01-15T05:00:00Z",
      endsAt: overrides.endsAt ?? "2025-01-15T07:00:00Z",
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
    expect(trigger.closest("[aria-label]")).not.toBeInTheDocument();
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

    expect(screen.queryByText(/\d{4}\/\d{2}\/\d{2}/)).not.toBeInTheDocument();
  });

  it("startsAt が number の場合ツールチップなし（タイトルのみ）", () => {
    const arg = {
      arg: {
        event: {
          title: "テスト",
          extendedProps: { startsAt: 12345, endsAt: "2025-01-15T16:00:00" },
        } as unknown as EventImpl,
      } as unknown as EventContentArg,
    };

    render(<EventWithTooltip {...arg} />);

    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}\/\d{2}\/\d{2}/)).not.toBeInTheDocument();
  });

  it("startsAt が object（非Date）の場合ツールチップなし", () => {
    const arg = {
      arg: {
        event: {
          title: "テスト",
          extendedProps: {
            startsAt: { foo: "bar" },
            endsAt: "2025-01-15T16:00:00",
          },
        } as unknown as EventImpl,
      } as unknown as EventContentArg,
    };

    render(<EventWithTooltip {...arg} />);

    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}\/\d{2}\/\d{2}/)).not.toBeInTheDocument();
  });

  it("endsAt が number の場合ツールチップなし", () => {
    const arg = {
      arg: {
        event: {
          title: "テスト",
          extendedProps: { startsAt: "2025-01-15T14:00:00", endsAt: 99999 },
        } as unknown as EventImpl,
      } as unknown as EventContentArg,
    };

    render(<EventWithTooltip {...arg} />);

    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}\/\d{2}\/\d{2}/)).not.toBeInTheDocument();
  });

  it("startsAt が undefined の場合ツールチップなし", () => {
    const arg = {
      arg: {
        event: {
          title: "テスト",
          extendedProps: { endsAt: "2025-01-15T16:00:00" },
        } as unknown as EventImpl,
      } as unknown as EventContentArg,
    };

    render(<EventWithTooltip {...arg} />);

    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}\/\d{2}\/\d{2}/)).not.toBeInTheDocument();
  });

  it("startsAt が null の場合ツールチップなし", () => {
    const arg = {
      arg: {
        event: {
          title: "テスト",
          extendedProps: { startsAt: null, endsAt: "2025-01-15T16:00:00" },
        } as unknown as EventImpl,
      } as unknown as EventContentArg,
    };

    render(<EventWithTooltip {...arg} />);

    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}\/\d{2}\/\d{2}/)).not.toBeInTheDocument();
  });

  it("Date 型の startsAt / endsAt で正しくレンダリングされる", () => {
    // 2025-03-10T01:00:00Z = 2025-03-10T10:00:00+09:00
    // 2025-03-10T03:30:00Z = 2025-03-10T12:30:00+09:00
    render(
      <EventWithTooltip
        {...buildArg({
          startsAt: new Date("2025-03-10T01:00:00Z"),
          endsAt: new Date("2025-03-10T03:30:00Z"),
        })}
      />,
    );

    const srOnly = screen.getByText(/2025\/03\/10/);
    expect(srOnly.className).toContain("sr-only");
    expect(srOnly.textContent).toBe(", 2025/03/10 10:00 - 12:30");
  });
});
