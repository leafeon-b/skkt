// @vitest-environment jsdom
import type { CircleSessionMatch } from "@/server/presentation/view-models/circle-session-detail";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchDialog } from "./match-dialog";
import type { ActiveDialog, PairMatchEntry, RowOutcome } from "./match-utils";

type MatchDialogProps = Parameters<typeof MatchDialog>[0];

const defaultMatch: CircleSessionMatch = {
  id: "match-1",
  player1Id: "row-1",
  player2Id: "col-1",
  outcome: "P1_WIN",
  createdAtInput: "2025-04-01",
};

const defaultPairMatches: PairMatchEntry[] = [
  { match: defaultMatch, index: 0 },
];

const outcomeOptions: Array<{ value: RowOutcome; label: string }> = [
  { value: "ROW_WIN", label: "藤井太郎の勝ち" },
  { value: "ROW_LOSS", label: "羽生次郎の勝ち" },
  { value: "DRAW", label: "引き分け" },
  { value: "UNKNOWN", label: "未記録" },
];

function buildDefaultProps(
  overrides: Partial<MatchDialogProps> = {},
): MatchDialogProps {
  return {
    activeDialog: { mode: "add", rowId: "row-1", columnId: "col-1" },
    dialogTitle: "対局結果の入力",
    dialogRowName: "藤井太郎",
    dialogColumnName: "羽生次郎",
    activePairMatches: defaultPairMatches,
    selectedMatch: defaultPairMatches[0],
    selectedOutcome: "ROW_WIN",
    selectedDate: "2025-04-01",
    outcomeOptions,
    createMatchIsPending: false,
    updateMatchIsPending: false,
    onRequestDelete: undefined,
    handleMatchSelectChange: vi.fn(),
    handleDialogSubmit: vi.fn((e: FormEvent<HTMLFormElement>) =>
      e.preventDefault(),
    ),
    setSelectedOutcome: vi.fn(),
    setSelectedDate: vi.fn(),
    closeDialog: vi.fn(),
    handleCloseAutoFocus: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("MatchDialog", () => {
  describe("削除ボタンの表示制御", () => {
    it("onRequestDelete が関数の場合、削除ボタンが表示される", () => {
      const onRequestDelete = vi.fn();
      render(
        <MatchDialog
          {...buildDefaultProps({
            activeDialog: { mode: "edit", rowId: "row-1", columnId: "col-1" },
            onRequestDelete,
          })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByRole("button", { name: /削除/ }),
      ).toBeInTheDocument();
    });

    it("onRequestDelete が undefined の場合、削除ボタンが表示されない", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({
            activeDialog: { mode: "edit", rowId: "row-1", columnId: "col-1" },
            onRequestDelete: undefined,
          })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).queryByRole("button", { name: /削除/ }),
      ).not.toBeInTheDocument();
    });

    it("削除ボタンクリック時に onRequestDelete コールバックが1回呼ばれる", async () => {
      const user = userEvent.setup();
      const onRequestDelete = vi.fn();
      render(
        <MatchDialog
          {...buildDefaultProps({
            activeDialog: { mode: "edit", rowId: "row-1", columnId: "col-1" },
            onRequestDelete,
          })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: /削除/ }),
      );

      expect(onRequestDelete).toHaveBeenCalledOnce();
    });
  });

  describe("edit モード", () => {
    const editDialog: ActiveDialog = {
      mode: "edit",
      rowId: "row-1",
      columnId: "col-1",
    };

    it("対局選択ドロップダウン（「対象の対局結果」ラベル）が表示される", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ activeDialog: editDialog })}
        />,
      );

      expect(screen.getByText("対象の対局結果")).toBeInTheDocument();
    });

    it("送信ボタンのラベルが「保存」である", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ activeDialog: editDialog })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByRole("button", { name: "保存" }),
      ).toBeInTheDocument();
    });

    it("対局選択ドロップダウンの変更で handleMatchSelectChange が呼ばれる", async () => {
      const user = userEvent.setup();
      const handleMatchSelectChange = vi.fn();
      const twoMatches: PairMatchEntry[] = [
        {
          match: {
            id: "match-1",
            player1Id: "row-1",
            player2Id: "col-1",
            outcome: "P1_WIN",
            createdAtInput: "2025-04-01",
          },
          index: 0,
        },
        {
          match: {
            id: "match-2",
            player1Id: "row-1",
            player2Id: "col-1",
            outcome: "P2_WIN",
            createdAtInput: "2025-04-02",
          },
          index: 1,
        },
      ];

      render(
        <MatchDialog
          {...buildDefaultProps({
            activeDialog: editDialog,
            activePairMatches: twoMatches,
            selectedMatch: twoMatches[0],
            handleMatchSelectChange,
          })}
        />,
      );

      const label = screen.getByText("対象の対局結果");
      const select = label.parentElement!.querySelector("select")!;
      await user.selectOptions(select, "1");

      expect(handleMatchSelectChange).toHaveBeenCalledWith(1);
    });
  });

  describe("add モード", () => {
    const addDialog: ActiveDialog = {
      mode: "add",
      rowId: "row-1",
      columnId: "col-1",
    };

    it("対局選択ドロップダウンが表示されない", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ activeDialog: addDialog })}
        />,
      );

      expect(screen.queryByText("対象の対局結果")).not.toBeInTheDocument();
    });

    it("送信ボタンのラベルが「追加」である", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ activeDialog: addDialog })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByRole("button", { name: "追加" }),
      ).toBeInTheDocument();
    });
  });

  describe("共通の表示・操作", () => {
    it("ダイアログタイトルが表示される", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ dialogTitle: "テストタイトル" })}
        />,
      );

      expect(screen.getByText("テストタイトル")).toBeInTheDocument();
    });

    it("対局者名（dialogRowName × dialogColumnName）が表示される", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({
            dialogRowName: "藤井太郎",
            dialogColumnName: "羽生次郎",
          })}
        />,
      );

      expect(screen.getByText("藤井太郎 × 羽生次郎")).toBeInTheDocument();
    });

    it("キャンセルボタンクリック時に closeDialog が呼ばれる", async () => {
      const user = userEvent.setup();
      const closeDialog = vi.fn();
      render(
        <MatchDialog
          {...buildDefaultProps({ closeDialog })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: "キャンセル" }),
      );

      expect(closeDialog).toHaveBeenCalled();
    });

    it("createMatchIsPending が true のとき送信ボタンが disabled かつラベルが「処理中…」", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ createMatchIsPending: true })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      const submitButton = within(dialog).getByRole("button", {
        name: "処理中…",
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it("updateMatchIsPending が true のとき送信ボタンが disabled かつラベルが「処理中…」", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ updateMatchIsPending: true })}
        />,
      );

      const dialog = screen.getByRole("dialog");
      const submitButton = within(dialog).getByRole("button", {
        name: "処理中…",
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it("activeDialog が null のときダイアログが開かない", () => {
      render(
        <MatchDialog
          {...buildDefaultProps({ activeDialog: null })}
        />,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
