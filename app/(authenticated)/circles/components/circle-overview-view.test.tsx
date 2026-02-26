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
      <button data-testid="withdraw-button">退会</button>
    ),
  }),
);

vi.mock(
  "@/app/(authenticated)/circles/components/circle-delete-button",
  () => ({
    CircleDeleteButton: () => (
      <button data-testid="circle-delete-button">削除</button>
    ),
  }),
);

vi.mock(
  "@/app/(authenticated)/circles/components/circle-rename-dialog",
  () => ({
    CircleRenameDialog: () => (
      <button data-testid="circle-rename-dialog">名前変更</button>
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
    membershipCount: 5,
    scheduleNote: null,
    nextSession: null,
    viewerRole: null,
    sessions: [],
    members: [],
    holidayDates: [],
    canDeleteCircle: false,
    canRenameCircle: false,
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
    expect(screen.getByTestId("create-link")).toBeInTheDocument();
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
    expect(screen.getByTestId("create-link")).toBeInTheDocument();
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

  it("canRenameCircle が true の場合、名前変更ダイアログが表示される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ canRenameCircle: true })}
      />,
    );

    expect(screen.getByTestId("circle-rename-dialog")).toBeInTheDocument();
  });

  it("canRenameCircle が false の場合、名前変更ダイアログが表示されない", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ canRenameCircle: false })}
      />,
    );

    expect(
      screen.queryByTestId("circle-rename-dialog"),
    ).not.toBeInTheDocument();
  });

  it("canDeleteCircle が true の場合、削除ボタンが表示される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ canDeleteCircle: true })}
      />,
    );

    expect(screen.getByTestId("circle-delete-button")).toBeInTheDocument();
  });

  it("canDeleteCircle が false の場合、削除ボタンが表示されない", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ canDeleteCircle: false })}
      />,
    );

    expect(
      screen.queryByTestId("circle-delete-button"),
    ).not.toBeInTheDocument();
  });
});
