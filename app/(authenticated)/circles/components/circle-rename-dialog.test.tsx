// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type MutationBehavior,
  makeMutationMock,
} from "@/test-helpers/trpc-mutation-mock";
import { CircleRenameDialog } from "./circle-rename-dialog";

let renameBehavior: MutationBehavior = "idle";

const useMutationHolder = vi.hoisted(() => {
  const noop = (): unknown => ({});
  return { current: noop as (...args: unknown[]) => unknown };
});

const { useMutation, resetSpy } = makeMutationMock(
  () => renameBehavior,
  { errorMessage: "変更に失敗しました" },
);
useMutationHolder.current =
  useMutation as unknown as typeof useMutationHolder.current;

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circles: {
      rename: {
        useMutation: (...args: unknown[]) => useMutationHolder.current(...args),
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
  resetSpy.mockClear();
  renameBehavior = "idle";
});

const CIRCLE_ID = "circle-1";
const CIRCLE_NAME = "テスト研究会";

async function openDialog() {
  const user = userEvent.setup();
  render(<CircleRenameDialog circleId={CIRCLE_ID} circleName={CIRCLE_NAME} />);
  const trigger = screen.getByRole("button", { name: "研究会名を変更" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
}

describe("CircleRenameDialog", () => {
  it("ダイアログ表示時に入力欄に現在の研究会名がプリセットされている", async () => {
    const { dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    expect(input).toHaveValue(CIRCLE_NAME);
  });

  it("入力を空にすると送信ボタンが disabled", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.clear(input);

    const submitButton = within(dialog).getByRole("button", { name: "変更" });
    expect(submitButton).toBeDisabled();
  });

  it("元の名前と同じ値では送信ボタンが disabled", async () => {
    const { dialog } = await openDialog();

    const submitButton = within(dialog).getByRole("button", { name: "変更" });
    expect(submitButton).toBeDisabled();
  });

  it("成功時にダイアログが閉じる", async () => {
    renameBehavior = "success";
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.clear(input);
    await user.type(input, "新しい名前");

    const submitButton = within(dialog).getByRole("button", { name: "変更" });
    await user.click(submitButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("エラー時に role='alert' でエラーメッセージが表示される", async () => {
    renameBehavior = "error";
    const { dialog } = await openDialog();

    const alert = within(dialog).getByRole("alert");
    expect(alert).toHaveTextContent("変更に失敗しました");
  });

  it("isPending 中は送信ボタンが disabled でラベルが「変更中...」", async () => {
    renameBehavior = "pending";
    const { dialog } = await openDialog();

    const submitButton = within(dialog).getByRole("button", {
      name: "変更中...",
    });
    expect(submitButton).toBeDisabled();
  });

  it("ダイアログを閉じると name が元の研究会名にリセットされ mutation.reset() が呼ばれる", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.clear(input);
    await user.type(input, "変更途中");

    const cancelButton = within(dialog).getByRole("button", {
      name: "キャンセル",
    });
    await user.click(cancelButton);

    expect(resetSpy).toHaveBeenCalled();

    // 再度開いて元の名前にリセットされていることを確認
    const trigger = screen.getByRole("button", { name: "研究会名を変更" });
    await user.click(trigger);
    const dialog2 = await screen.findByRole("dialog");
    const input2 = within(dialog2).getByPlaceholderText("研究会名");
    expect(input2).toHaveValue(CIRCLE_NAME);
  });

  it("文字数カウンターが {current} / 50 形式で表示される", async () => {
    const { user, dialog } = await openDialog();

    // 初期状態は circleName の文字数
    expect(within(dialog).getByLabelText("研究会名の文字数")).toHaveTextContent(
      `${CIRCLE_NAME.length} / 50`,
    );

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.clear(input);
    await user.type(input, "テスト");

    expect(within(dialog).getByLabelText("研究会名の文字数")).toHaveTextContent(
      "3 / 50",
    );
  });

  it("空白のみの入力では送信してもダイアログが閉じない", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.clear(input);
    await user.type(input, "   ");

    const submitButton = within(dialog).getByRole("button", { name: "変更" });
    await user.click(submitButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("前後に空白がある名前でも送信に成功する", async () => {
    renameBehavior = "success";
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.clear(input);
    await user.type(input, "  新しい名前  ");

    const submitButton = within(dialog).getByRole("button", { name: "変更" });
    await user.click(submitButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("80%（40文字）以上で aria-live='polite' が有効化される", async () => {
    const { user, dialog } = await openDialog();

    const counter = within(dialog).getByLabelText("研究会名の文字数");
    // 初期状態（6文字 "テスト研究会"）では off
    expect(counter).toHaveAttribute("aria-live", "off");

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.clear(input);
    // 40文字入力（80%）
    await user.type(input, "あ".repeat(40));

    expect(counter).toHaveAttribute("aria-live", "polite");
  });
});
