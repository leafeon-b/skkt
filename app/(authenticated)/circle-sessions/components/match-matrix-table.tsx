import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  CircleSessionMatch,
  CircleSessionParticipation,
} from "@/server/presentation/view-models/circle-session-detail";
import {
  getMatchOutcome,
  getNameInitial,
  getPairMatches,
  type DialogMode,
} from "./match-utils";

type MatchMatrixTableProps = {
  participations: CircleSessionParticipation[];
  matches: CircleSessionMatch[];
  openDialog: (mode: DialogMode, rowId: string, columnId: string) => void;
};

const getCellResults = (
  matches: CircleSessionMatch[],
  rowId: string,
  columnId: string,
) => {
  if (rowId === columnId) {
    return {
      type: "series",
      results: [
        {
          label: "—",
          className: "bg-(--brand-ink)/5 text-(--brand-ink-muted)",
          title: "同一参加者",
          kind: "self",
        },
      ],
    } as const;
  }

  const pairMatches = getPairMatches(matches, rowId, columnId).map(
    ({ match }) => match,
  );

  if (pairMatches.length === 0) {
    return {
      type: "series",
      results: [
        {
          label: "未",
          className: "bg-white/70 text-(--brand-ink-muted)",
          title: "未記録",
          kind: "unknown",
        },
      ],
    } as const;
  }

  const results = pairMatches.map((match) => getMatchOutcome(rowId, match));

  if (results.length <= 2) {
    return { type: "series", results } as const;
  }

  type ResultKind = "win" | "loss" | "draw" | "unknown" | "self";

  const counts = results.reduce<Record<ResultKind, number>>(
    (acc, result) => {
      const k = result.kind as ResultKind;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    { win: 0, loss: 0, draw: 0, unknown: 0, self: 0 },
  );

  const details = [
    `勝ち${counts.win}`,
    `負け${counts.loss}`,
    counts.draw ? `引き分け${counts.draw}` : null,
    counts.unknown ? `未記録${counts.unknown}` : null,
  ].filter(Boolean);

  return {
    type: "aggregate",
    label: counts.draw
      ? `${counts.win}勝${counts.loss}敗${counts.draw}分`
      : `${counts.win}勝${counts.loss}敗`,
    title: details.join(" / "),
  } as const;
};

const getCellDisplay = (
  matches: CircleSessionMatch[],
  rowId: string,
  columnId: string,
) => {
  const cell = getCellResults(matches, rowId, columnId);

  if (cell.type === "aggregate") {
    return { text: cell.label, title: cell.title, muted: false };
  }

  const labels = cell.results.map((result) => result.label);
  const titles = cell.results.map((result) => result.title);
  const allMuted = cell.results.every(
    (result) => result.kind === "unknown" || result.kind === "self",
  );
  const text =
    labels.length > 1 && labels.every((label) => label === "未")
      ? "未"
      : labels.join("");

  return { text, title: titles.join(" / "), muted: allMuted };
};

const getRowTotals = (matches: CircleSessionMatch[], rowId: string) => {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const match of matches) {
    const isRowParticipation =
      match.player1Id === rowId || match.player2Id === rowId;

    if (!isRowParticipation) {
      continue;
    }

    if (match.outcome === "UNKNOWN") {
      continue;
    }

    if (match.outcome === "DRAW") {
      draws += 1;
      continue;
    }

    const rowIsPlayer1 = match.player1Id === rowId;
    const rowWon =
      (rowIsPlayer1 && match.outcome === "P1_WIN") ||
      (!rowIsPlayer1 && match.outcome === "P2_WIN");

    if (rowWon) {
      wins += 1;
    } else {
      losses += 1;
    }
  }

  return { wins, losses, draws };
};

export function MatchMatrixTable({
  participations,
  matches,
  openDialog,
}: MatchMatrixTableProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-1">
      <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-(--brand-ink)">
              対局結果
            </p>
            <p className="mt-2 text-xs text-(--brand-ink-muted)">
              ○=勝ち ●=負け △=引き分け 未=未記録
            </p>
          </div>
          <p className="text-xs text-(--brand-ink-muted)">
            {participations.length}名参加
          </p>
        </div>
        <div className="relative mt-4 rounded-2xl border border-border/60 bg-white/70">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 rounded-l-2xl bg-linear-to-r from-(--brand-ink)/20 to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 rounded-r-2xl bg-linear-to-l from-(--brand-ink)/20 to-transparent sm:hidden" />
          <Table className="min-w-130 border-collapse text-sm sm:min-w-160">
            <TableHeader className="bg-white/80 [&_tr]:border-border/60">
              <TableRow className="border-b border-border/60">
                <TableHead className="bg-(--brand-ink)/5 px-3 py-3 text-left text-xs font-semibold text-(--brand-ink)">
                  自分＼相手
                </TableHead>
                {participations.map((participation) => (
                  <TableHead
                    key={participation.id}
                    className="whitespace-nowrap bg-(--brand-ink)/5 px-3 py-3 text-center text-xs font-semibold text-(--brand-ink)"
                    scope="col"
                    title={participation.name}
                  >
                    <span className="block sm:hidden">
                      {getNameInitial(participation.name)}
                    </span>
                    <span className="hidden sm:block">
                      {participation.name}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap border-l border-border/60 bg-(--brand-ink)/5 px-3 py-3 text-center text-xs font-semibold text-(--brand-ink)">
                  勝敗
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participations.map((rowParticipation) => {
                const totals = getRowTotals(matches, rowParticipation.id);
                return (
                  <TableRow
                    key={rowParticipation.id}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <TableHead
                      scope="row"
                      className="whitespace-nowrap bg-(--brand-ink)/5 px-3 py-3 text-left text-xs font-semibold text-(--brand-ink)"
                    >
                      {rowParticipation.name}
                    </TableHead>
                    {participations.map((columnParticipation) => {
                      const cellKey = `${rowParticipation.id}-${columnParticipation.id}`;
                      const pairMatchEntries = getPairMatches(
                        matches,
                        rowParticipation.id,
                        columnParticipation.id,
                      );
                      const hasMatches = pairMatchEntries.length > 0;
                      const isSelf =
                        rowParticipation.id === columnParticipation.id;
                      const cellDisplay = getCellDisplay(
                        matches,
                        rowParticipation.id,
                        columnParticipation.id,
                      );

                      const cellButtonClassName =
                        `flex w-full items-center justify-center rounded-full px-2 py-1 text-xs transition ${
                          cellDisplay.muted
                            ? "text-(--brand-ink-muted)"
                            : "text-(--brand-ink)"
                        } ${
                          hasMatches
                            ? "hover:bg-(--brand-ink)/10"
                            : "hover:bg-(--brand-ink)/5"
                        }`.trim();

                      return (
                        <TableCell
                          key={cellKey}
                          className="border-l border-border/60 px-2 py-2 text-center text-xs"
                        >
                          {isSelf ? (
                            <button
                              type="button"
                              className={cellButtonClassName}
                              title={cellDisplay.title}
                              disabled
                            >
                              {cellDisplay.text}
                            </button>
                          ) : hasMatches ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className={cellButtonClassName}
                                  title={cellDisplay.title}
                                  data-cell-id={cellKey}
                                >
                                  {cellDisplay.text}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center">
                                <DropdownMenuItem
                                  onClick={() =>
                                    openDialog(
                                      "add",
                                      rowParticipation.id,
                                      columnParticipation.id,
                                    )
                                  }
                                >
                                  追加
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openDialog(
                                      "edit",
                                      rowParticipation.id,
                                      columnParticipation.id,
                                    )
                                  }
                                >
                                  編集
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openDialog(
                                      "delete",
                                      rowParticipation.id,
                                      columnParticipation.id,
                                    )
                                  }
                                >
                                  削除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <button
                              type="button"
                              className={cellButtonClassName}
                              title={cellDisplay.title}
                              data-cell-id={cellKey}
                              onClick={() =>
                                openDialog(
                                  "add",
                                  rowParticipation.id,
                                  columnParticipation.id,
                                )
                              }
                            >
                              {cellDisplay.text}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="border-l border-border/60 px-3 py-2 text-center text-xs text-(--brand-ink-muted)">
                      {totals.wins}勝{totals.losses}敗
                      {totals.draws ? `${totals.draws}分` : ""}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
