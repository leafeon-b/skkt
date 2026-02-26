// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type MutationBehavior,
  makeMutationMock,
} from "@/test-helpers/trpc-mutation-mock";
import { CircleCreateDialog } from "./circle-create-dialog";

const pushMock = vi.fn();

let createBehavior: MutationBehavior = "idle";

const useMutationHolder = vi.hoisted(() => {
  const noop = (): unknown => ({});
  return { current: noop as (...args: unknown[]) => unknown };
});

const { useMutation, mutateSpyRef, resetSpy } = makeMutationMock<{
  id: string;
}>(() => createBehavior, {
  errorMessage: "作成に失敗しました",
  successData: { id: "new-circle-id" },
});
useMutationHolder.current =
  useMutation as unknown as typeof useMutationHolder.current;

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    circles: {
      create: {
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

afterEach(() => {
  cleanup();
  pushMock.mockClear();
  resetSpy.mockClear();
  mutateSpyRef.current.mockClear();
  createBehavior = "idle";
});

async function openDialog() {
  const user = userEvent.setup();
  render(<CircleCreateDialog />);
  const trigger = screen.getByRole("button", { name: "研究会作成" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
}

describe("CircleCreateDialog", () => {
  it("空入力で送信ボタンクリックしても mutate が呼ばれない", async () => {
    const { user, dialog } = await openDialog();

    const submitButton = within(dialog).getByRole("button", { name: "作成" });
    await user.click(submitButton);

    expect(mutateSpyRef.current).not.toHaveBeenCalled();
  });

  it("有効な名前入力後に送信すると mutate が呼ばれる", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.type(input, "新しい研究会");

    const submitButton = within(dialog).getByRole("button", { name: "作成" });
    await user.click(submitButton);

    expect(mutateSpyRef.current).toHaveBeenCalledWith({ name: "新しい研究会" });
  });

  it("成功時に router.push が呼ばれダイアログが閉じる", async () => {
    createBehavior = "success";
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.type(input, "新しい研究会");

    const submitButton = within(dialog).getByRole("button", { name: "作成" });
    await user.click(submitButton);

    expect(pushMock).toHaveBeenCalledWith("/circles/new-circle-id");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("エラー時に role='alert' でエラーメッセージが表示される", async () => {
    createBehavior = "error";
    const { dialog } = await openDialog();

    const alert = within(dialog).getByRole("alert");
    expect(alert).toHaveTextContent("作成に失敗しました");
  });

  it("isPending 中は送信ボタンが disabled でラベルが「作成中...」", async () => {
    createBehavior = "pending";
    const { dialog } = await openDialog();

    const submitButton = within(dialog).getByRole("button", {
      name: "作成中...",
    });
    expect(submitButton).toBeDisabled();
  });

  it("ダイアログを閉じると name がリセットされ mutation.reset() が呼ばれる", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.type(input, "テスト");

    const cancelButton = within(dialog).getByRole("button", {
      name: "キャンセル",
    });
    await user.click(cancelButton);

    expect(resetSpy).toHaveBeenCalled();

    // 再度開いて入力がリセットされていることを確認
    const trigger = screen.getByRole("button", { name: "研究会作成" });
    await user.click(trigger);
    const dialog2 = await screen.findByRole("dialog");
    const input2 = within(dialog2).getByPlaceholderText("研究会名");
    expect(input2).toHaveValue("");
  });

  it("文字数カウンターが {current} / 50 形式で表示される", async () => {
    const { user, dialog } = await openDialog();

    expect(
      within(dialog).getByLabelText("研究会名の文字数"),
    ).toHaveTextContent("0 / 50");

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.type(input, "テスト");

    expect(
      within(dialog).getByLabelText("研究会名の文字数"),
    ).toHaveTextContent("3 / 50");
  });

  it("空白のみの入力では送信ボタンクリックしても mutate が呼ばれない", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.type(input, "   ");

    const submitButton = within(dialog).getByRole("button", { name: "作成" });
    await user.click(submitButton);

    expect(mutateSpyRef.current).not.toHaveBeenCalled();
  });

  it("前後の空白を除去して mutate が呼ばれる", async () => {
    const { user, dialog } = await openDialog();

    const input = within(dialog).getByPlaceholderText("研究会名");
    await user.type(input, "  新しい研究会  ");

    const submitButton = within(dialog).getByRole("button", { name: "作成" });
    await user.click(submitButton);

    expect(mutateSpyRef.current).toHaveBeenCalledWith({ name: "新しい研究会" });
  });

  it("80%（40文字）以上で aria-live='polite' が有効化される", async () => {
    const { user, dialog } = await openDialog();

    const counter = within(dialog).getByLabelText("研究会名の文字数");
    expect(counter).toHaveAttribute("aria-live", "off");

    const input = within(dialog).getByPlaceholderText("研究会名");
    // 40文字入力（80%）
    await user.type(input, "あ".repeat(40));

    expect(counter).toHaveAttribute("aria-live", "polite");
  });

  describe("文字数カウンターのカラー遷移", () => {
    it("0文字 → muted カラー", async () => {
      const { dialog } = await openDialog();

      const counter = within(dialog).getByLabelText("研究会名の文字数");
      expect(counter).toHaveClass("text-(--brand-ink-muted)");
      expect(counter).toHaveAttribute("aria-live", "off");
    });

    it("39文字 → muted カラー（amber 閾値の直前）", async () => {
      const { user, dialog } = await openDialog();

      const input = within(dialog).getByPlaceholderText("研究会名");
      await user.type(input, "あ".repeat(39));

      const counter = within(dialog).getByLabelText("研究会名の文字数");
      expect(counter).toHaveClass("text-(--brand-ink-muted)");
      expect(counter).toHaveAttribute("aria-live", "off");
    });

    it("40文字 → amber カラー（80% 閾値境界）", async () => {
      const { user, dialog } = await openDialog();

      const input = within(dialog).getByPlaceholderText("研究会名");
      await user.type(input, "あ".repeat(40));

      const counter = within(dialog).getByLabelText("研究会名の文字数");
      expect(counter).toHaveClass("text-amber-600");
      expect(counter).toHaveAttribute("aria-live", "polite");
    });

    it("49文字 → amber カラー（destructive 直前）", async () => {
      const { user, dialog } = await openDialog();

      const input = within(dialog).getByPlaceholderText("研究会名");
      await user.type(input, "あ".repeat(49));

      const counter = within(dialog).getByLabelText("研究会名の文字数");
      expect(counter).toHaveClass("text-amber-600");
      expect(counter).toHaveAttribute("aria-live", "polite");
    });

    it("50文字 → destructive カラー（上限境界）", async () => {
      const { user, dialog } = await openDialog();

      const input = within(dialog).getByPlaceholderText("研究会名");
      await user.type(input, "あ".repeat(50));

      const counter = within(dialog).getByLabelText("研究会名の文字数");
      expect(counter).toHaveClass("text-destructive");
      expect(counter).toHaveAttribute("aria-live", "polite");
    });
  });
});
