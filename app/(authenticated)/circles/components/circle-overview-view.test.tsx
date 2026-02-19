// @vitest-environment jsdom
import type { CircleOverviewViewModel } from "@/server/presentation/view-models/circle-overview";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircleOverviewView } from "./circle-overview-view";

vi.mock(
  "@/app/(authenticated)/circles/components/circle-overview-calendar",
  () => ({
    CircleOverviewCalendar: ({
      createSessionHref,
    }: {
      sessions: unknown[];
      createSessionHref: string | null;
    }) => (
      <div data-testid="calendar" data-create-href={createSessionHref ?? ""}>
        {createSessionHref ? (
          <span data-testid="create-link">予定の作成</span>
        ) : null}
      </div>
    ),
  }),
);

vi.mock(
  "@/app/(authenticated)/circles/components/circle-withdraw-button",
  () => ({
    CircleWithdrawButton: () => (
      <button data-testid="withdraw-button">脱退</button>
    ),
  }),
);

afterEach(() => {
  cleanup();
});

function buildOverview(
  overrides: Partial<CircleOverviewViewModel> = {},
): CircleOverviewViewModel {
  return {
    circleId: "circle-1",
    circleName: "テスト研究会",
    participationCount: 5,
    scheduleNote: null,
    nextSession: null,
    viewerRole: null,
    sessions: [],
    members: [],
    ...overrides,
  };
}

describe("CircleOverviewView ロールベース表示制御", () => {
  const getCreateSessionHref = () => "/circles/circle-1/sessions/new";

  it("owner の場合、createSessionHref がカレンダーに渡される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ viewerRole: "owner" })}
        getCreateSessionHref={getCreateSessionHref}
      />,
    );

    const calendar = screen.getByTestId("calendar");
    expect(calendar.dataset.createHref).toBe("/circles/circle-1/sessions/new");
    expect(screen.getByTestId("create-link")).toBeDefined();
  });

  it("manager の場合、createSessionHref がカレンダーに渡される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ viewerRole: "manager" })}
        getCreateSessionHref={getCreateSessionHref}
      />,
    );

    const calendar = screen.getByTestId("calendar");
    expect(calendar.dataset.createHref).toBe("/circles/circle-1/sessions/new");
    expect(screen.getByTestId("create-link")).toBeDefined();
  });

  it("member の場合、createSessionHref が null になる", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ viewerRole: "member" })}
        getCreateSessionHref={getCreateSessionHref}
      />,
    );

    const calendar = screen.getByTestId("calendar");
    expect(calendar.dataset.createHref).toBe("");
    expect(screen.queryByTestId("create-link")).not.toBeInTheDocument();
  });

  it("viewerRole が null の場合、createSessionHref が null になる", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ viewerRole: null })}
        getCreateSessionHref={getCreateSessionHref}
      />,
    );

    const calendar = screen.getByTestId("calendar");
    expect(calendar.dataset.createHref).toBe("");
    expect(screen.queryByTestId("create-link")).not.toBeInTheDocument();
  });

  it("getCreateSessionHref が未指定の場合、owner でも null になる", () => {
    render(
      <CircleOverviewView overview={buildOverview({ viewerRole: "owner" })} />,
    );

    const calendar = screen.getByTestId("calendar");
    expect(calendar.dataset.createHref).toBe("");
    expect(screen.queryByTestId("create-link")).not.toBeInTheDocument();
  });
});
