import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  getOutcomeLabel,
  getRowOutcomeValue,
  getTodayInputValue,
  type ActiveDialog,
  type PairMatchEntry,
  type RowOutcome,
} from "./match-utils";
import { MatchSelect } from "./match-select";

type MatchDialogProps = {
  activeDialog: ActiveDialog | null;
  dialogRowName: string;
  dialogColumnName: string;
  activePairMatches: PairMatchEntry[];
  outcomeOptions: Array<{ value: RowOutcome; label: string }>;
  createMatchIsPending: boolean;
  updateMatchIsPending: boolean;
  onRequestDelete: (() => void) | undefined;
  onSubmit: (data: { outcome: RowOutcome; date: string }) => void;
  closeDialog: () => void;
  handleCloseAutoFocus: (event: Event) => void;
};

export { type MatchDialogProps };

export function MatchDialog({
  activeDialog,
  dialogRowName,
  dialogColumnName,
  activePairMatches,
  outcomeOptions,
  createMatchIsPending,
  updateMatchIsPending,
  onRequestDelete,
  onSubmit,
  closeDialog,
  handleCloseAutoFocus,
}: MatchDialogProps) {
  const dialogTitle =
    activeDialog?.mode === "add" ? "対局結果を追加" : "対局結果を編集";

  return (
    <Dialog
      open={activeDialog != null && activeDialog.mode !== "delete"}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent
        className="max-w-md rounded-2xl border-border/60 bg-white p-6 shadow-xl"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader>
          <p className="text-xs font-semibold text-(--brand-ink-muted)">
            対局結果
          </p>
          <DialogTitle className="text-lg font-semibold text-(--brand-ink)">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="rounded-xl border border-border/60 bg-(--brand-ink)/5 px-3 py-2 text-sm font-semibold text-(--brand-ink)">
            {dialogRowName} × {dialogColumnName}
          </DialogDescription>
        </DialogHeader>

        {activeDialog ? (
          <MatchDialogForm
            key={`${activeDialog.mode}-${activeDialog.rowId}-${activeDialog.columnId}`}
            activeDialog={activeDialog}
            dialogRowName={dialogRowName}
            dialogColumnName={dialogColumnName}
            activePairMatches={activePairMatches}
            outcomeOptions={outcomeOptions}
            createMatchIsPending={createMatchIsPending}
            updateMatchIsPending={updateMatchIsPending}
            onRequestDelete={onRequestDelete}
            onSubmit={onSubmit}
            closeDialog={closeDialog}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MatchDialogForm({
  activeDialog,
  dialogRowName,
  dialogColumnName,
  activePairMatches,
  outcomeOptions,
  createMatchIsPending,
  updateMatchIsPending,
  onRequestDelete,
  onSubmit,
  closeDialog,
}: {
  activeDialog: ActiveDialog;
  dialogRowName: string;
  dialogColumnName: string;
  activePairMatches: PairMatchEntry[];
  outcomeOptions: Array<{ value: RowOutcome; label: string }>;
  createMatchIsPending: boolean;
  updateMatchIsPending: boolean;
  onRequestDelete: (() => void) | undefined;
  onSubmit: (data: { outcome: RowOutcome; date: string }) => void;
  closeDialog: () => void;
}) {
  const firstMatch = activePairMatches[0];
  const initialOutcome: RowOutcome =
    activeDialog.mode === "edit" && firstMatch
      ? getRowOutcomeValue(activeDialog.rowId, firstMatch.match)
      : "ROW_WIN";
  const initialDate =
    activeDialog.mode === "edit" && firstMatch
      ? firstMatch.match.createdAtInput
      : getTodayInputValue();
  const initialMatchIndex =
    activeDialog.mode === "edit" && firstMatch ? firstMatch.index : null;

  const [selectedOutcome, setSelectedOutcome] =
    useState<RowOutcome>(initialOutcome);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(
    initialMatchIndex,
  );

  const handleMatchSelectChange = (nextIndex: number) => {
    const selected = activePairMatches.find(
      (entry) => entry.index === nextIndex,
    );
    if (selected) {
      setSelectedMatchIndex(selected.index);
      setSelectedOutcome(
        getRowOutcomeValue(activeDialog.rowId, selected.match),
      );
      setSelectedDate(selected.match.createdAtInput);
    } else {
      setSelectedMatchIndex(null);
      setSelectedOutcome("ROW_WIN");
      setSelectedDate(getTodayInputValue());
    }
  };

  const selectedMatch =
    activePairMatches.length > 0
      ? (activePairMatches.find(
          (entry) => entry.index === selectedMatchIndex,
        ) ?? activePairMatches[0])
      : null;

  return (
    <>
      {activeDialog.mode === "edit" ? (
        <div>
          <label className="text-xs font-semibold text-(--brand-ink)">
            対象の対局結果
          </label>
          <MatchSelect
            activePairMatches={activePairMatches}
            selectedMatch={selectedMatch}
            onMatchSelectChange={handleMatchSelectChange}
            getOptionLabel={(entry, index) => {
              const rowOutcome = getRowOutcomeValue(
                activeDialog.rowId,
                entry.match,
              );
              return `第${index + 1}局目: ${getOutcomeLabel(
                rowOutcome,
                dialogRowName,
                dialogColumnName,
              )}`;
            }}
          />
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ outcome: selectedOutcome, date: selectedDate });
        }}
      >
        <p className="mb-3 text-xs text-(--brand-ink-muted)">
          <span className="text-red-600" aria-hidden="true">
            *
          </span>{" "}
          は必須項目です
        </p>
        <label
          htmlFor="match-outcome"
          className="block text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
        >
          結果
        </label>
        <select
          id="match-outcome"
          className="mt-2 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-(--brand-ink) shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={selectedOutcome}
          onChange={(event) =>
            setSelectedOutcome(event.target.value as RowOutcome)
          }
          required
        >
          {outcomeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="mt-4">
          <label
            htmlFor="match-date"
            className="block text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
          >
            対局日
          </label>
          <input
            id="match-date"
            type="date"
            className="mt-2 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-(--brand-ink) shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            required
          />
        </div>
        <DialogFooter className="mt-6">
          {onRequestDelete ? (
            <Button
              type="button"
              variant="destructive"
              className="mr-auto"
              onClick={onRequestDelete}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              削除
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="border-(--brand-ink)/20 bg-white/80 text-(--brand-ink)"
            onClick={closeDialog}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
            disabled={createMatchIsPending || updateMatchIsPending}
          >
            {createMatchIsPending || updateMatchIsPending
              ? "処理中…"
              : activeDialog.mode === "add"
                ? "追加"
                : "保存"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
