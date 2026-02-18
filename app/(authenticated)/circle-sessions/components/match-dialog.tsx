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
import type { FormEvent } from "react";
import {
  getMatchOutcome,
  type ActiveDialog,
  type PairMatchEntry,
  type RowOutcome,
} from "./match-utils";

type MatchDialogProps = {
  activeDialog: ActiveDialog | null;
  dialogTitle: string;
  dialogRowName: string;
  dialogColumnName: string;
  activePairMatches: PairMatchEntry[];
  selectedMatch: PairMatchEntry | null;
  selectedOutcome: RowOutcome;
  selectedDate: string;
  outcomeOptions: Array<{ value: RowOutcome; label: string }>;
  createMatchIsPending: boolean;
  updateMatchIsPending: boolean;
  onRequestDelete: (() => void) | undefined;
  handleMatchSelectChange: (nextIndex: number) => void;
  handleDialogSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setSelectedOutcome: (outcome: RowOutcome) => void;
  setSelectedDate: (date: string) => void;
  closeDialog: () => void;
  handleCloseAutoFocus: (event: Event) => void;
};

export function MatchDialog({
  activeDialog,
  dialogTitle,
  dialogRowName,
  dialogColumnName,
  activePairMatches,
  selectedMatch,
  selectedOutcome,
  selectedDate,
  outcomeOptions,
  createMatchIsPending,
  updateMatchIsPending,
  onRequestDelete,
  handleMatchSelectChange,
  handleDialogSubmit,
  setSelectedOutcome,
  setSelectedDate,
  closeDialog,
  handleCloseAutoFocus,
}: MatchDialogProps) {
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

        {activeDialog?.mode === "edit" ? (
          <div>
            <label className="text-xs font-semibold text-(--brand-ink)">
              対象の対局結果
            </label>
            {activePairMatches.length > 1 ? (
              <select
                className="mt-2 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-(--brand-ink) shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                value={selectedMatch?.index ?? ""}
                onChange={(event) =>
                  handleMatchSelectChange(Number(event.target.value))
                }
              >
                {activePairMatches.map((entry, index) => {
                  const outcome = getMatchOutcome(
                    activeDialog.rowId,
                    entry.match,
                  );
                  return (
                    <option key={entry.index} value={entry.index}>
                      第{index + 1}局目: {outcome.title}
                    </option>
                  );
                })}
              </select>
            ) : (
              <p className="mt-2 text-sm text-(--brand-ink-muted)">
                {selectedMatch
                  ? `第1局目: ${getMatchOutcome(activeDialog.rowId, selectedMatch.match).title}`
                  : "対局結果なし"}
              </p>
            )}
          </div>
        ) : null}

        <form onSubmit={handleDialogSubmit}>
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
                : activeDialog?.mode === "add"
                  ? "追加"
                  : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
