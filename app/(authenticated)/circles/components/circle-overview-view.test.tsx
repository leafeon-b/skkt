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

vi.mock(
  "@/app/(authenticated)/circles/components/member-role-dropdown",
  () => ({
    MemberRoleDropdown: ({ userId }: { userId: string }) => (
      <button data-testid={`role-edit-${userId}`}>ロールを変更</button>
    ),
  }),
);

vi.mock(
  "@/app/(authenticated)/circles/components/remove-circle-member-button",
  () => ({
    RemoveCircleMemberButton: ({ userId }: { userId: string }) => (
      <button data-testid={`remove-member-${userId}`}>除外</button>
    ),
  }),
);

vi.mock(
  "@/app/(authenticated)/circles/components/transfer-circle-ownership-dialog",
  () => ({
    TransferCircleOwnershipDialog: () => (
      <button data-testid="transfer-ownership-button">オーナーを移譲</button>
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
    canTransferOwnership: false,
    viewerUserId: null,
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

  it("canChangeRole が true のメンバーにはロールバッジと編集ボタンが表示される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({
          members: [
            {
              userId: "user-1",
              name: "テストユーザー",
              role: "manager",
              canChangeRole: true,
              canRemoveMember: false,
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("マネージャー")).toBeInTheDocument();
    expect(screen.getByTestId("role-edit-user-1")).toBeInTheDocument();
  });

  it("canRemoveMember が true のメンバーには除外ボタンが表示される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({
          members: [
            {
              userId: "user-3",
              name: "除外対象ユーザー",
              role: "member",
              canChangeRole: false,
              canRemoveMember: true,
            },
          ],
        })}
      />,
    );

    expect(screen.getByTestId("remove-member-user-3")).toBeInTheDocument();
  });

  it("canRemoveMember が false のメンバーには除外ボタンが表示されない", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({
          members: [
            {
              userId: "user-4",
              name: "除外不可ユーザー",
              role: "member",
              canChangeRole: false,
              canRemoveMember: false,
            },
          ],
        })}
      />,
    );

    expect(
      screen.queryByTestId("remove-member-user-4"),
    ).not.toBeInTheDocument();
  });

  it("canChangeRole が false のメンバーにはロールバッジのみ表示される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({
          members: [
            {
              userId: "user-2",
              name: "オーナーユーザー",
              role: "owner",
              canChangeRole: false,
              canRemoveMember: false,
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("オーナー")).toBeInTheDocument();
    expect(screen.queryByTestId("role-edit-user-2")).not.toBeInTheDocument();
  });
});

describe("CircleOverviewView オーナー移譲ボタン", () => {
  it("canTransferOwnership: true かつ viewerUserId が存在する場合、移譲ボタンが表示される", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({
          canTransferOwnership: true,
          viewerUserId: "viewer-1",
        })}
      />,
    );

    expect(
      screen.getByTestId("transfer-ownership-button"),
    ).toBeInTheDocument();
  });

  it("canTransferOwnership: false の場合、移譲ボタンが表示されない", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({ canTransferOwnership: false })}
      />,
    );

    expect(
      screen.queryByTestId("transfer-ownership-button"),
    ).not.toBeInTheDocument();
  });

  it("canTransferOwnership: true かつ viewerUserId: null の場合、移譲ボタンが表示されない", () => {
    render(
      <CircleOverviewView
        overview={buildOverview({
          canTransferOwnership: true,
          viewerUserId: null,
        })}
      />,
    );

    expect(
      screen.queryByTestId("transfer-ownership-button"),
    ).not.toBeInTheDocument();
  });
});
