// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MutationBehavior,
  makeMutationMock,
} from "@/test-helpers/trpc-mutation-mock";
import { CircleDeleteButton } from "./circle-delete-button";

const pushMock = vi.fn();

let deleteBehavior: MutationBehavior = "idle";

const useMutationHolder = vi.hoisted(() => {
  const noop = (): unknown => ({});
  return { current: noop as (...args: unknown[]) => unknown };
});

const { useMutation, mutateSpyRef } = makeMutationMock(() => deleteBehavior, {
  hasReset: false,
});
useMutationHolder.current =
  useMutation as unknown as typeof useMutationHolder.current;

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circles: {
      delete: {
        useMutation: (...args: unknown[]) => useMutationHolder.current(...args),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  pushMock.mockClear();
  deleteBehavior = "idle";
});

const CIRCLE_NAME = "テスト研究会";

async function openDialog() {
  const user = userEvent.setup();
  render(<CircleDeleteButton circleId="circle-1" circleName={CIRCLE_NAME} />);
  const trigger = screen.getByRole("button", {
    name: `「${CIRCLE_NAME}」を削除`,
  });
  await user.click(trigger);
  const dialog = await screen.findByRole("alertdialog");
  return { user, dialog };
}

describe("CircleDeleteButton", () => {
  let toastModule: {
    toast: { error: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    toastModule = (await import("sonner")) as unknown as typeof toastModule;
    toastModule.toast.error.mockClear();
  });

  it("確認入力が不一致の間、削除ボタンが disabled", async () => {
    const { user, dialog } = await openDialog();

    const deleteButton = within(dialog).getByRole("button", {
      name: "削除する",
    });
    expect(deleteButton).toBeDisabled();

    const input = within(dialog).getByPlaceholderText(CIRCLE_NAME);
    await user.type(input, "別の名前");
    expect(deleteButton).toBeDisabled();
  });

  it("確認入力が完全一致で削除ボタンが有効化", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText(CIRCLE_NAME);
    await user.type(input, CIRCLE_NAME);

    const deleteButton = within(dialog).getByRole("button", {
      name: "削除する",
    });
    expect(deleteButton).toBeEnabled();
  });

  it("ダイアログ再開時に確認入力がリセット", async () => {
    const user = userEvent.setup();
    render(<CircleDeleteButton circleId="circle-1" circleName={CIRCLE_NAME} />);

    // ダイアログを開いてテキストを入力
    const trigger = screen.getByRole("button", {
      name: `「${CIRCLE_NAME}」を削除`,
    });
    await user.click(trigger);
    const dialog = await screen.findByRole("alertdialog");
    const input = within(dialog).getByPlaceholderText(CIRCLE_NAME);
    await user.type(input, CIRCLE_NAME);
    expect(input).toHaveValue(CIRCLE_NAME);

    // キャンセルで閉じる
    const cancelButton = within(dialog).getByRole("button", {
      name: "キャンセル",
    });
    await user.click(cancelButton);

    // 再度開く
    await user.click(trigger);
    const dialog2 = await screen.findByRole("alertdialog");
    const input2 = within(dialog2).getByPlaceholderText(CIRCLE_NAME);
    expect(input2).toHaveValue("");
  });

  it("削除成功時に router.push('/') が呼ばれる", async () => {
    deleteBehavior = "success";
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText(CIRCLE_NAME);
    await user.type(input, CIRCLE_NAME);

    const deleteButton = within(dialog).getByRole("button", {
      name: "削除する",
    });
    await user.click(deleteButton);

    expect(mutateSpyRef.current).toHaveBeenCalledWith({ circleId: "circle-1" });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("削除失敗時に toast.error が呼ばれダイアログが閉じる", async () => {
    deleteBehavior = "error";
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText(CIRCLE_NAME);
    await user.type(input, CIRCLE_NAME);

    const deleteButton = within(dialog).getByRole("button", {
      name: "削除する",
    });
    await user.click(deleteButton);

    expect(toastModule.toast.error).toHaveBeenCalledWith(
      "研究会の削除に失敗しました",
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("isPending 中はダイアログが閉じられない", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CircleDeleteButton circleId="circle-1" circleName={CIRCLE_NAME} />,
    );

    // まずダイアログを開く（idle状態）
    const trigger = screen.getByRole("button", {
      name: `「${CIRCLE_NAME}」を削除`,
    });
    await user.click(trigger);
    await screen.findByRole("alertdialog");

    // pending状態に切り替えて再レンダリング
    deleteBehavior = "pending";
    rerender(
      <CircleDeleteButton circleId="circle-1" circleName={CIRCLE_NAME} />,
    );

    const dialog = screen.getByRole("alertdialog");

    // キャンセルボタンが disabled
    const cancelButton = within(dialog).getByRole("button", {
      name: "キャンセル",
    });
    expect(cancelButton).toBeDisabled();

    // 入力フィールドも disabled
    const input = within(dialog).getByPlaceholderText(CIRCLE_NAME);
    expect(input).toBeDisabled();

    // 削除ボタンのラベルが「削除中…」
    expect(
      within(dialog).getByRole("button", { name: "削除中…" }),
    ).toBeInTheDocument();

    // ダイアログが表示されたままであること
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
