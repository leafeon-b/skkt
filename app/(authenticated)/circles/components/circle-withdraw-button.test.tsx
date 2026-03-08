// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MutationBehavior,
  makeMutationMock,
} from "@/test-helpers/trpc-mutation-mock";
import { CircleWithdrawButton } from "./circle-withdraw-button";

const pushMock = vi.fn();

let withdrawBehavior: MutationBehavior = "idle";

const useMutationHolder = vi.hoisted(() => {
  const noop = (): unknown => ({});
  return { current: noop as (...args: unknown[]) => unknown };
});

const { useMutation, mutateSpyRef } = makeMutationMock(
  () => withdrawBehavior,
  { hasReset: false },
);
useMutationHolder.current =
  useMutation as unknown as typeof useMutationHolder.current;

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circles: {
      memberships: {
        withdraw: {
          useMutation: (...args: unknown[]) =>
            useMutationHolder.current(...args),
        },
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
  withdrawBehavior = "idle";
});

const CIRCLE_ID = "circle-1";
const CIRCLE_NAME = "テスト研究会";

async function openDialog() {
  const user = userEvent.setup();
  render(
    <CircleWithdrawButton circleId={CIRCLE_ID} circleName={CIRCLE_NAME} />,
  );
  const trigger = screen.getByRole("button", {
    name: `「${CIRCLE_NAME}」から退会`,
  });
  await user.click(trigger);
  const dialog = await screen.findByRole("alertdialog");
  return { user, dialog };
}

describe("CircleWithdrawButton", () => {
  let toastModule: {
    toast: { error: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    toastModule = (await import("sonner")) as unknown as typeof toastModule;
    toastModule.toast.error.mockClear();
  });

  it("ボタンクリックで確認ダイアログが開く", async () => {
    const { dialog } = await openDialog();
    expect(dialog).toBeInTheDocument();
  });

  it("「退会する」ボタンで mutation が circleId を引数に実行される", async () => {
    withdrawBehavior = "success";
    const { user, dialog } = await openDialog();

    const mutateSpy = mutateSpyRef.current;

    const withdrawButton = within(dialog).getByRole("button", {
      name: "退会する",
    });
    await user.click(withdrawButton);

    expect(mutateSpy).toHaveBeenCalledWith({ circleId: CIRCLE_ID });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("mutation 処理中はダイアログのボタンが disabled になる", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CircleWithdrawButton circleId={CIRCLE_ID} circleName={CIRCLE_NAME} />,
    );

    const trigger = screen.getByRole("button", {
      name: `「${CIRCLE_NAME}」から退会`,
    });
    await user.click(trigger);
    await screen.findByRole("alertdialog");

    withdrawBehavior = "pending";
    rerender(
      <CircleWithdrawButton circleId={CIRCLE_ID} circleName={CIRCLE_NAME} />,
    );

    const dialog = screen.getByRole("alertdialog");

    const cancelButton = within(dialog).getByRole("button", {
      name: "キャンセル",
    });
    expect(cancelButton).toBeDisabled();

    expect(
      within(dialog).getByRole("button", { name: "退会中…" }),
    ).toBeDisabled();
  });

  it("エラー時に toast.error が表示される", async () => {
    withdrawBehavior = "error";
    const { user, dialog } = await openDialog();

    const withdrawButton = within(dialog).getByRole("button", {
      name: "退会する",
    });
    await user.click(withdrawButton);

    expect(toastModule.toast.error).toHaveBeenCalledWith("退会に失敗しました");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("aria-label に研究会名が含まれる", () => {
    render(
      <CircleWithdrawButton circleId={CIRCLE_ID} circleName={CIRCLE_NAME} />,
    );

    expect(
      screen.getByRole("button", { name: `「${CIRCLE_NAME}」から退会` }),
    ).toBeInTheDocument();
  });
});
