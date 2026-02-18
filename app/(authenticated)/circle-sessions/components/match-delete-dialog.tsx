import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getMatchOutcome, type ActiveDialog, type PairMatchEntry } from "./match-utils";

type MatchDeleteDialogProps = {
  activeDialog: ActiveDialog | null;
  dialogRowName: string;
  dialogColumnName: string;
  activePairMatches: PairMatchEntry[];
  selectedMatch: PairMatchEntry | null;
  deleteMatchIsPending: boolean;
  handleMatchSelectChange: (nextIndex: number) => void;
  handleDelete: () => void;
  closeDialog: () => void;
  handleCloseAutoFocus: (event: Event) => void;
};

export function MatchDeleteDialog({
  activeDialog,
  dialogRowName,
  dialogColumnName,
  activePairMatches,
  selectedMatch,
  deleteMatchIsPending,
  handleMatchSelectChange,
  handleDelete,
  closeDialog,
  handleCloseAutoFocus,
}: MatchDeleteDialogProps) {
  return (
    <AlertDialog
      open={activeDialog?.mode === "delete"}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <AlertDialogContent onCloseAutoFocus={handleCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>対局結果を削除</AlertDialogTitle>
          <AlertDialogDescription>
            この対局結果を削除します。操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {activeDialog?.mode === "delete" ? (
          <>
            <div className="rounded-xl border border-border/60 bg-(--brand-ink)/5 px-3 py-2 text-sm font-semibold text-(--brand-ink)">
              {dialogRowName} × {dialogColumnName}
            </div>
            <div>
              <label
                htmlFor="delete-match-select"
                className="text-xs font-semibold text-(--brand-ink)"
              >
                対象の対局結果
              </label>
              {activePairMatches.length > 1 ? (
                <select
                  id="delete-match-select"
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
          </>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMatchIsPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMatchIsPending}
          >
            {deleteMatchIsPending ? "削除中…" : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
