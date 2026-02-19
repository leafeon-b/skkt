// @vitest-environment jsdom
import type { CircleSessionDetailViewModel } from "@/server/presentation/view-models/circle-session-detail";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CircleSessionDetailView } from "./circle-session-detail-view";

const pushMock = vi.fn();
const refreshMock = vi.fn();

type MutationBehavior = "idle" | "success" | "error";
let matchCreateBehavior: MutationBehavior = "idle";
let matchUpdateBehavior: MutationBehavior = "idle";
let matchDeleteBehavior: MutationBehavior = "idle";

function makeMutationMock(getBehavior: () => MutationBehavior) {
  return (options?: { onSuccess?: () => void; onError?: () => void }) => {
    const mutateFn = vi.fn(
      (_data: unknown, inline?: { onSuccess?: () => void }) => {
        const behavior = getBehavior();
        if (behavior === "success") {
          options?.onSuccess?.();
          inline?.onSuccess?.();
        } else if (behavior === "error") {
          options?.onError?.();
        }
      },
    );
    return {
      mutate: mutateFn,
      isPending: false,
      data: null,
      error: null,
    };
  };
}

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circleSessions: {
      delete: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
          data: null,
          error: null,
        }),
      },
    },
    matches: {
      create: {
        useMutation: makeMutationMock(() => matchCreateBehavior),
      },
      update: {
        useMutation: makeMutationMock(() => matchUpdateBehavior),
      },
      delete: {
        useMutation: makeMutationMock(() => matchDeleteBehavior),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: refreshMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  pushMock.mockClear();
  refreshMock.mockClear();
  matchCreateBehavior = "idle";
  matchUpdateBehavior = "idle";
  matchDeleteBehavior = "idle";
});

function buildDetail(
  overrides: Partial<CircleSessionDetailViewModel> = {},
): CircleSessionDetailViewModel {
  return {
    circleSessionId: "session-1",
    circleId: "circle-1",
    circleName: "テスト研究会",
    title: "第1回例会",
    dateTimeLabel: "2025-04-01 10:00〜18:00",
    locationLabel: null,
    memoText: null,
    sessionDateInput: "2025-04-01",
    startsAtInput: "2025-04-01T10:00",
    endsAtInput: "2025-04-01T18:00",
    viewerRole: "owner",
    canCreateCircleSession: false,
    canDeleteCircleSession: false,
    canWithdrawFromCircleSession: false,
    participations: [],
    matches: [],
    ...overrides,
  };
}

describe("CircleSessionDetailView 複製ボタン", () => {
  describe("表示条件", () => {
    it("canCreateCircleSession: true の場合、複製ボタンが表示される", () => {
      render(
        <CircleSessionDetailView
          detail={buildDetail({ canCreateCircleSession: true })}
        />,
      );

      expect(screen.getByRole("button", { name: "セッションの複製" })).toBeDefined();
    });

    it("canCreateCircleSession: false の場合、複製ボタンが表示されない", () => {
      render(
        <CircleSessionDetailView
          detail={buildDetail({ canCreateCircleSession: false })}
        />,
      );

      expect(screen.queryByRole("button", { name: "セッションの複製" })).not.toBeInTheDocument();
    });
  });

  describe("遷移先URL", () => {
    it("クリック時に正しいベースURLとパラメータで router.push が呼ばれる", async () => {
      const user = userEvent.setup();
      render(
        <CircleSessionDetailView
          detail={buildDetail({
            canCreateCircleSession: true,
            circleId: "circle-1",
            title: "第1回例会",
            startsAtInput: "2025-04-01T10:00",
            endsAtInput: "2025-04-01T18:00",
          })}
        />,
      );

      await user.click(screen.getByRole("button", { name: "セッションの複製" }));

      expect(pushMock).toHaveBeenCalledOnce();
      const url = pushMock.mock.calls[0][0] as string;
      expect(url).toContain("/circles/circle-1/sessions/new");
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("title")).toBe("第1回例会");
      expect(params.get("startsAt")).toBe("2025-04-01T10:00");
      expect(params.get("endsAt")).toBe("2025-04-01T18:00");
      expect(params.has("location")).toBe(false);
      expect(params.has("note")).toBe(false);
    });

    it("locationLabel がある場合、location パラメータが含まれる", async () => {
      const user = userEvent.setup();
      render(
        <CircleSessionDetailView
          detail={buildDetail({
            canCreateCircleSession: true,
            locationLabel: "将棋会館",
          })}
        />,
      );

      await user.click(screen.getByRole("button", { name: "セッションの複製" }));

      const url = pushMock.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("location")).toBe("将棋会館");
    });

    it("memoText がある場合、note パラメータが含まれる", async () => {
      const user = userEvent.setup();
      render(
        <CircleSessionDetailView
          detail={buildDetail({
            canCreateCircleSession: true,
            memoText: "持ち物: 将棋盤",
          })}
        />,
      );

      await user.click(screen.getByRole("button", { name: "セッションの複製" }));

      const url = pushMock.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("note")).toBe("持ち物: 将棋盤");
    });

    it("locationLabel と memoText の両方がある場合、両パラメータが含まれる", async () => {
      const user = userEvent.setup();
      render(
        <CircleSessionDetailView
          detail={buildDetail({
            canCreateCircleSession: true,
            locationLabel: "将棋会館",
            memoText: "持ち物: 将棋盤",
          })}
        />,
      );

      await user.click(screen.getByRole("button", { name: "セッションの複製" }));

      const url = pushMock.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("location")).toBe("将棋会館");
      expect(params.get("note")).toBe("持ち物: 将棋盤");
    });
  });
});

const twoParticipations = [
  { id: "p1", name: "藤井太郎" },
  { id: "p2", name: "羽生次郎" },
];

const oneMatch = [
  {
    id: "match-1",
    player1Id: "p1",
    player2Id: "p2",
    outcome: "P1_WIN" as const,
    createdAtInput: "2025-01-01",
  },
];

async function openAddDialogForEmptyCell() {
  const user = userEvent.setup();
  render(
    <CircleSessionDetailView
      detail={buildDetail({
        participations: twoParticipations,
        matches: [],
      })}
    />,
  );
  const cell = document.querySelector('[data-cell-id="p1-p2"]');
  expect(cell).toBeInTheDocument();
  await user.click(cell!);
  return user;
}

async function openEditDialogViaDropdown() {
  const user = userEvent.setup();
  render(
    <CircleSessionDetailView
      detail={buildDetail({
        participations: twoParticipations,
        matches: oneMatch,
      })}
    />,
  );
  const cell = document.querySelector('[data-cell-id="p1-p2"]');
  expect(cell).toBeInTheDocument();
  await user.click(cell!);
  const editItem = await screen.findByRole("menuitem", { name: "編集" });
  await user.click(editItem);
  return user;
}

async function openDeleteDialogViaDropdown() {
  const user = userEvent.setup();
  render(
    <CircleSessionDetailView
      detail={buildDetail({
        participations: twoParticipations,
        matches: oneMatch,
      })}
    />,
  );
  const cell = document.querySelector('[data-cell-id="p1-p2"]');
  expect(cell).toBeInTheDocument();
  await user.click(cell!);
  const deleteItem = await screen.findByRole("menuitem", { name: "削除" });
  await user.click(deleteItem);
  return user;
}

describe("CircleSessionDetailView mutation エラーパス", () => {
  let toastModule: {
    toast: {
      success: ReturnType<typeof vi.fn>;
      error: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    toastModule = (await import("sonner")) as unknown as typeof toastModule;
    toastModule.toast.success.mockClear();
    toastModule.toast.error.mockClear();
  });

  describe("createMatch", () => {
    it("エラー時にダイアログが閉じ、エラートーストが表示される", async () => {
      matchCreateBehavior = "error";
      const user = await openAddDialogForEmptyCell();

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeDefined();

      const submitButton = within(dialog).getByRole("button", { name: "追加" });
      await user.click(submitButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(toastModule.toast.error).toHaveBeenCalledWith(
        "対局結果の追加に失敗しました",
      );
    });

    it("成功時にダイアログが閉じ、成功トーストと router.refresh が呼ばれる", async () => {
      matchCreateBehavior = "success";
      const user = await openAddDialogForEmptyCell();

      const dialog = await screen.findByRole("dialog");
      const submitButton = within(dialog).getByRole("button", { name: "追加" });
      await user.click(submitButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(toastModule.toast.success).toHaveBeenCalledOnce();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  describe("updateMatch", () => {
    it("エラー時にダイアログが閉じ、エラートーストが表示される", async () => {
      matchUpdateBehavior = "error";
      const user = await openEditDialogViaDropdown();

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeDefined();

      const submitButton = within(dialog).getByRole("button", { name: "保存" });
      await user.click(submitButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(toastModule.toast.error).toHaveBeenCalledWith(
        "対局結果の更新に失敗しました",
      );
    });

    it("成功時にダイアログが閉じ、成功トーストと router.refresh が呼ばれる", async () => {
      matchUpdateBehavior = "success";
      const user = await openEditDialogViaDropdown();

      const dialog = await screen.findByRole("dialog");
      const submitButton = within(dialog).getByRole("button", { name: "保存" });
      await user.click(submitButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(toastModule.toast.success).toHaveBeenCalledOnce();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  describe("deleteMatch", () => {
    it("エラー時にダイアログが閉じ、エラートーストが表示される", async () => {
      matchDeleteBehavior = "error";
      const user = await openDeleteDialogViaDropdown();

      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toBeDefined();

      const deleteButton = within(dialog).getByRole("button", { name: "削除" });
      await user.click(deleteButton);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(toastModule.toast.error).toHaveBeenCalledWith(
        "対局結果の削除に失敗しました",
      );
    });

    it("成功時にダイアログが閉じ、成功トーストと router.refresh が呼ばれる", async () => {
      matchDeleteBehavior = "success";
      const user = await openDeleteDialogViaDropdown();

      const dialog = await screen.findByRole("alertdialog");
      const deleteButton = within(dialog).getByRole("button", { name: "削除" });
      await user.click(deleteButton);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(toastModule.toast.success).toHaveBeenCalledOnce();
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});

describe("編集ダイアログの日付プリフィル", () => {
  it("編集ダイアログを開くと対局日にcreatedAtInputの値がプリフィルされる", async () => {
    await openEditDialogViaDropdown();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("対局日")).toHaveValue(
      oneMatch[0].createdAtInput,
    );
  });
});
