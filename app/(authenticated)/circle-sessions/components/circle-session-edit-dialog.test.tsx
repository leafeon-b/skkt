// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircleSessionEditDialog } from "./circle-session-edit-dialog";

type MutationBehavior = "idle" | "success" | "error";
let updateBehavior: MutationBehavior = "idle";
const mutateMock = vi.fn();
const resetMock = vi.fn();

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circleSessions: {
      update: {
        useMutation: (options?: {
          onSuccess?: () => void;
          onError?: () => void;
        }) => {
          mutateMock.mockImplementation(
            (_data: unknown, inline?: { onSuccess?: () => void }) => {
              const behavior = updateBehavior;
              if (behavior === "success") {
                options?.onSuccess?.();
                inline?.onSuccess?.();
              } else if (behavior === "error") {
                options?.onError?.();
              }
            },
          );
          return {
            mutate: mutateMock,
            isPending: false,
            data: null,
            error:
              updateBehavior === "error"
                ? { message: "更新に失敗しました" }
                : null,
            reset: resetMock,
          };
        },
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  mutateMock.mockClear();
  resetMock.mockClear();
  updateBehavior = "idle";
});

const defaultProps: {
  circleSessionId: string;
  title: string;
  startsAtInput: string;
  endsAtInput: string;
  locationLabel: string | null;
  memoText: string | null;
} = {
  circleSessionId: "session-1",
  title: "第1回例会",
  startsAtInput: "2025-04-01T10:00",
  endsAtInput: "2025-04-01T18:00",
  locationLabel: "将棋会館",
  memoText: "持ち物: 将棋盤",
};

async function openEditDialog(overrides: Partial<typeof defaultProps> = {}) {
  const user = userEvent.setup();
  render(<CircleSessionEditDialog {...defaultProps} {...overrides} />);
  await user.click(screen.getByRole("button", { name: "セッションを編集" }));
  return user;
}

describe("CircleSessionEditDialog", () => {
  describe("レンダリング", () => {
    it("トリガーボタンが表示される", () => {
      render(<CircleSessionEditDialog {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "セッションを編集" }),
      ).toBeInTheDocument();
    });

    it("ダイアログを開くと各フィールドに初期値がセットされる", async () => {
      await openEditDialog();

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByLabelText("タイトル")).toHaveValue(
        "第1回例会",
      );
      expect(within(dialog).getByLabelText("開始日時")).toHaveValue(
        "2025-04-01T10:00",
      );
      expect(within(dialog).getByLabelText("終了日時")).toHaveValue(
        "2025-04-01T18:00",
      );
      expect(within(dialog).getByLabelText("場所（任意）")).toHaveValue(
        "将棋会館",
      );
      expect(within(dialog).getByLabelText("備考（任意）")).toHaveValue(
        "持ち物: 将棋盤",
      );
    });

    it("locationLabel が null の場合、場所フィールドが空文字になる", async () => {
      await openEditDialog({ locationLabel: null });

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByLabelText("場所（任意）")).toHaveValue("");
    });

    it("memoText が null の場合、備考フィールドが空文字になる", async () => {
      await openEditDialog({ memoText: null });

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByLabelText("備考（任意）")).toHaveValue("");
    });
  });

  describe("送信", () => {
    it("成功時にダイアログが閉じる", async () => {
      updateBehavior = "success";
      const user = await openEditDialog();

      const dialog = await screen.findByRole("dialog");
      const submitButton = within(dialog).getByRole("button", {
        name: "保存",
      });
      await user.click(submitButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("タイトルが空白のみの場合、customValidity が設定される", async () => {
      const user = await openEditDialog();

      const dialog = await screen.findByRole("dialog");
      const titleInput = within(dialog).getByLabelText("タイトル");
      await user.clear(titleInput);
      await user.type(titleInput, "   ");

      expect(
        (titleInput as HTMLInputElement).validationMessage,
      ).toBe("タイトルを入力してください");
    });

    it("空白のみから有効なタイトルに変更すると customValidity がクリアされる", async () => {
      const user = await openEditDialog();

      const dialog = await screen.findByRole("dialog");
      const titleInput = within(dialog).getByLabelText("タイトル");
      await user.clear(titleInput);
      await user.type(titleInput, "   ");
      expect(
        (titleInput as HTMLInputElement).validationMessage,
      ).toBe("タイトルを入力してください");

      await user.clear(titleInput);
      await user.type(titleInput, "テスト");
      expect((titleInput as HTMLInputElement).validationMessage).toBe("");
    });
  });

  describe("キャンセル", () => {
    it("キャンセルをクリックするとダイアログが閉じ、値がリセットされる", async () => {
      const user = await openEditDialog();

      const dialog = await screen.findByRole("dialog");
      const titleInput = within(dialog).getByLabelText("タイトル");
      await user.clear(titleInput);
      await user.type(titleInput, "変更後のタイトル");

      const cancelButton = within(dialog).getByRole("button", {
        name: "キャンセル",
      });
      await user.click(cancelButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "セッションを編集" }),
      );

      const reopenedDialog = await screen.findByRole("dialog");
      expect(within(reopenedDialog).getByLabelText("タイトル")).toHaveValue(
        "第1回例会",
      );
    });
  });
});
