// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MutationBehavior,
  makeMutationMock,
} from "@/test-helpers/trpc-mutation-mock";
import { RemoveCircleMemberButton } from "./remove-circle-member-button";

let removeBehavior: MutationBehavior = "idle";

const useMutationHolder = vi.hoisted(() => {
  const noop = (): unknown => ({});
  return { current: noop as (...args: unknown[]) => unknown };
});

const { useMutation } = makeMutationMock(() => removeBehavior, {
  hasReset: false,
});
useMutationHolder.current =
  useMutation as unknown as typeof useMutationHolder.current;

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circles: {
      memberships: {
        remove: {
          useMutation: (...args: unknown[]) =>
            useMutationHolder.current(...args),
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

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  removeBehavior = "idle";
});

const defaultProps = {
  circleId: "circle-1",
  userId: "user-1",
  memberName: "テストユーザー",
};

async function openDialog() {
  const user = userEvent.setup();
  render(<RemoveCircleMemberButton {...defaultProps} />);
  const trigger = screen.getByRole("button", {
    name: `${defaultProps.memberName}を除外`,
  });
  await user.click(trigger);
  const dialog = await screen.findByRole("alertdialog");
  return { user, dialog };
}

describe("RemoveCircleMemberButton", () => {
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

  it("トリガーボタンクリックで確認ダイアログが開く", async () => {
    const { dialog } = await openDialog();
    expect(dialog).toBeInTheDocument();
  });

  it("「キャンセル」クリックでダイアログが閉じる", async () => {
    const { user, dialog } = await openDialog();

    const cancelButton = within(dialog).getByRole("button", {
      name: "キャンセル",
    });
    await user.click(cancelButton);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("成功時: ダイアログが閉じ、成功 toast が表示される", async () => {
    removeBehavior = "success";
    const { user, dialog } = await openDialog();

    const removeButton = within(dialog).getByRole("button", {
      name: "除外する",
    });
    await user.click(removeButton);

    expect(toastModule.toast.success).toHaveBeenCalledWith(
      "テストユーザーを除外しました",
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("エラー時: ダイアログが閉じ、エラー toast が表示される", async () => {
    removeBehavior = "error";
    const { user, dialog } = await openDialog();

    const removeButton = within(dialog).getByRole("button", {
      name: "除外する",
    });
    await user.click(removeButton);

    expect(toastModule.toast.error).toHaveBeenCalledWith("除外に失敗しました", {
      description: "時間をおいて再度お試しください",
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mutation pending 中はボタンが disabled になり、テキストが「除外中…」に変わる", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RemoveCircleMemberButton {...defaultProps} />);

    const trigger = screen.getByRole("button", {
      name: `${defaultProps.memberName}を除外`,
    });
    await user.click(trigger);
    await screen.findByRole("alertdialog");

    removeBehavior = "pending";
    rerender(<RemoveCircleMemberButton {...defaultProps} />);

    const dialog = screen.getByRole("alertdialog");
    const removeButton = within(dialog).getByRole("button", {
      name: "除外中…",
    });
    expect(removeButton).toBeDisabled();
  });

  it("mutation pending 中はダイアログを閉じられない", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RemoveCircleMemberButton {...defaultProps} />);

    const trigger = screen.getByRole("button", {
      name: `${defaultProps.memberName}を除外`,
    });
    await user.click(trigger);
    await screen.findByRole("alertdialog");

    removeBehavior = "pending";
    rerender(<RemoveCircleMemberButton {...defaultProps} />);

    const dialog = screen.getByRole("alertdialog");

    const cancelButton = within(dialog).getByRole("button", {
      name: "キャンセル",
    });
    expect(cancelButton).toBeDisabled();

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
