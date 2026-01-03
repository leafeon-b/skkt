"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MatchOutcome = "P1_WIN" | "P2_WIN" | "DRAW" | "UNKNOWN";
type Match = { player1Id: string; player2Id: string; outcome: MatchOutcome };
type RowOutcome = "ROW_WIN" | "ROW_LOSS" | "DRAW" | "UNKNOWN";
type DialogMode = "add" | "edit" | "delete";
type ActiveDialog = {
  mode: DialogMode;
  rowId: string;
  columnId: string;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDateForInput = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getTodayInputValue = () => formatDateForInput(new Date());

const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const participants = [
  { id: "p1", name: "藤井 聡太" },
  { id: "p2", name: "豊島 将之" },
  { id: "p3", name: "永瀬 拓矢" },
  { id: "p4", name: "佐々木 勇気" },
  { id: "p5", name: "伊藤 匠" },
  { id: "p6", name: "菅井 竜也" },
];

const participantsById = Object.fromEntries(
  participants.map((participant) => [participant.id, participant])
) as Record<string, (typeof participants)[number]>;

const matches: Match[] = [
  { player1Id: "p1", player2Id: "p2", outcome: "P1_WIN" },
  { player1Id: "p2", player2Id: "p1", outcome: "P1_WIN" },
  { player1Id: "p1", player2Id: "p3", outcome: "P2_WIN" },
  { player1Id: "p1", player2Id: "p4", outcome: "DRAW" },
  { player1Id: "p2", player2Id: "p3", outcome: "P1_WIN" },
  { player1Id: "p2", player2Id: "p3", outcome: "P2_WIN" },
  { player1Id: "p3", player2Id: "p2", outcome: "P1_WIN" },
  { player1Id: "p2", player2Id: "p5", outcome: "P2_WIN" },
  { player1Id: "p3", player2Id: "p4", outcome: "UNKNOWN" },
  { player1Id: "p3", player2Id: "p6", outcome: "P2_WIN" },
  { player1Id: "p4", player2Id: "p5", outcome: "P1_WIN" },
  { player1Id: "p4", player2Id: "p5", outcome: "DRAW" },
  { player1Id: "p5", player2Id: "p4", outcome: "P1_WIN" },
  { player1Id: "p5", player2Id: "p6", outcome: "DRAW" },
];

const sessionBaseDate = new Date(2025, 2, 12);
const matchDatesByIndex = matches.map((_, index) =>
  formatDateForInput(addDays(sessionBaseDate, index))
);

const getParticipantName = (id: string) =>
  participantsById[id]?.name ?? "不明";

const getPairMatches = (rowId: string, columnId: string) =>
  matches
    .map((match, index) => ({ match, index }))
    .filter(
      ({ match }) =>
        (match.player1Id === rowId && match.player2Id === columnId) ||
        (match.player1Id === columnId && match.player2Id === rowId)
    );

const getRowOutcomeValue = (rowId: string, match: Match): RowOutcome => {
  if (match.outcome === "UNKNOWN") {
    return "UNKNOWN";
  }
  if (match.outcome === "DRAW") {
    return "DRAW";
  }

  const rowIsPlayer1 = match.player1Id === rowId;
  const rowWon =
    (rowIsPlayer1 && match.outcome === "P1_WIN") ||
    (!rowIsPlayer1 && match.outcome === "P2_WIN");

  return rowWon ? "ROW_WIN" : "ROW_LOSS";
};

const getOutcomeLabel = (
  outcome: RowOutcome,
  rowName: string,
  columnName: string
) => {
  switch (outcome) {
    case "ROW_WIN":
      return `${rowName}の勝ち`;
    case "ROW_LOSS":
      return `${columnName}の勝ち`;
    case "DRAW":
      return "引き分け";
    case "UNKNOWN":
      return "未記録";
    default:
      return "未記録";
  }
};

const getNameInitial = (name: string) => Array.from(name.trim())[0] ?? name;

const getMatchOutcome = (
  rowId: string,
  match: { player1Id: string; player2Id: string; outcome: MatchOutcome }
) => {
  if (match.outcome === "UNKNOWN") {
    return {
      label: "未",
      className: "bg-white/70 text-(--brand-ink-muted)",
      title: "未記録",
      kind: "unknown",
    } as const;
  }

  if (match.outcome === "DRAW") {
    return {
      label: "△",
      className: "bg-(--brand-gold)/20 text-(--brand-ink)",
      title: "引き分け",
      kind: "draw",
    } as const;
  }

  const rowIsPlayer1 = match.player1Id === rowId;
  const rowWon =
    (rowIsPlayer1 && match.outcome === "P1_WIN") ||
    (!rowIsPlayer1 && match.outcome === "P2_WIN");

  return rowWon
    ? {
        label: "○",
        className: "bg-(--brand-moss)/20 text-(--brand-ink)",
        title: "勝ち",
        kind: "win",
      }
    : {
        label: "●",
        className: "bg-(--brand-ink)/10 text-(--brand-ink)",
        title: "負け",
        kind: "loss",
      };
};

const getCellResults = (rowId: string, columnId: string) => {
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

  const pairMatches = getPairMatches(rowId, columnId).map(
    ({ match }) => match
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
    { win: 0, loss: 0, draw: 0, unknown: 0, self: 0 }
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

const getCellDisplay = (rowId: string, columnId: string) => {
  const cell = getCellResults(rowId, columnId);

  if (cell.type === "aggregate") {
    return { text: cell.label, title: cell.title, muted: false };
  }

  const labels = cell.results.map((result) => result.label);
  const titles = cell.results.map((result) => result.title);
  const allMuted = cell.results.every(
    (result) => result.kind === "unknown" || result.kind === "self"
  );
  const text =
    labels.length > 1 && labels.every((label) => label === "未")
      ? "未"
      : labels.join("");

  return { text, title: titles.join(" / "), muted: allMuted };
};

const getRowTotals = (rowId: string) => {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const match of matches) {
    const isRowParticipant =
      match.player1Id === rowId || match.player2Id === rowId;

    if (!isRowParticipant) {
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

export default function CircleSessionDemoPage() {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(
    null
  );
  const [selectedOutcome, setSelectedOutcome] =
    useState<RowOutcome>("UNKNOWN");
  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayInputValue()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyMatchSelection = (rowId: string, entry?: {
    match: Match;
    index: number;
  }) => {
    if (!entry) {
      setSelectedMatchIndex(null);
      setSelectedOutcome("UNKNOWN");
      setSelectedDate(getTodayInputValue());
      return;
    }

    setSelectedMatchIndex(entry.index);
    setSelectedOutcome(getRowOutcomeValue(rowId, entry.match));
    setSelectedDate(matchDatesByIndex[entry.index] ?? getTodayInputValue());
  };

  const initializeDialogState = (
    mode: DialogMode,
    rowId: string,
    columnId: string
  ) => {
    if (mode === "add") {
      setSelectedMatchIndex(null);
      setSelectedOutcome("UNKNOWN");
      setSelectedDate(getTodayInputValue());
      return;
    }

    const pairMatches = getPairMatches(rowId, columnId);
    applyMatchSelection(rowId, pairMatches[0]);
  };

  const openDialog = (mode: DialogMode, rowId: string, columnId: string) => {
    initializeDialogState(mode, rowId, columnId);
    setActiveDialog({ mode, rowId, columnId });
    setOpenMenuKey(null);
  };

  const closeDialog = () => setActiveDialog(null);

  const handleMatchSelectChange = (nextIndex: number) => {
    if (!activeDialog) {
      return;
    }
    const pairMatches = getPairMatches(
      activeDialog.rowId,
      activeDialog.columnId
    );
    const selected = pairMatches.find((entry) => entry.index === nextIndex);
    applyMatchSelection(activeDialog.rowId, selected);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleDialogSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeDialog) {
      return;
    }
    const rowName = getParticipantName(activeDialog.rowId);
    const columnName = getParticipantName(activeDialog.columnId);
    const actionLabel =
      activeDialog.mode === "add" ? "追加しました" : "保存しました";
    const outcomeLabel = getOutcomeLabel(selectedOutcome, rowName, columnName);
    showToast(
      `${actionLabel}: ${rowName} vs ${columnName} / ${outcomeLabel}`
    );
    setActiveDialog(null);
  };

  const handleDelete = () => {
    if (!activeDialog) {
      return;
    }
    const rowName = getParticipantName(activeDialog.rowId);
    const columnName = getParticipantName(activeDialog.columnId);
    const pairMatches = getPairMatches(
      activeDialog.rowId,
      activeDialog.columnId
    );
    const selected =
      selectedMatchIndex === null
        ? pairMatches[0]
        : pairMatches.find((entry) => entry.index === selectedMatchIndex) ??
          pairMatches[0];
    const outcomeLabel = selected
      ? getOutcomeLabel(
          getRowOutcomeValue(activeDialog.rowId, selected.match),
          rowName,
          columnName
        )
      : "結果不明";
    showToast(
      `削除しました: ${rowName} vs ${columnName} / ${outcomeLabel}`
    );
    setActiveDialog(null);
  };

  const activePairMatches = activeDialog
    ? getPairMatches(activeDialog.rowId, activeDialog.columnId)
    : [];
  const dialogRowName = activeDialog
    ? getParticipantName(activeDialog.rowId)
    : "";
  const dialogColumnName = activeDialog
    ? getParticipantName(activeDialog.columnId)
    : "";
  const dialogTitle = activeDialog
    ? activeDialog.mode === "add"
      ? "対局結果を追加"
      : activeDialog.mode === "edit"
        ? "対局結果を編集"
        : "対局結果を削除"
    : "";
  const outcomeOptions: Array<{ value: RowOutcome; label: string }> =
    activeDialog
      ? [
          {
            value: "ROW_WIN",
            label: getOutcomeLabel("ROW_WIN", dialogRowName, dialogColumnName),
          },
          {
            value: "ROW_LOSS",
            label: getOutcomeLabel("ROW_LOSS", dialogRowName, dialogColumnName),
          },
          {
            value: "DRAW",
            label: getOutcomeLabel("DRAW", dialogRowName, dialogColumnName),
          },
          {
            value: "UNKNOWN",
            label: getOutcomeLabel("UNKNOWN", dialogRowName, dialogColumnName),
          },
        ]
      : [];
  const selectedMatch =
    activeDialog && activePairMatches.length > 0
      ? activePairMatches.find((entry) => entry.index === selectedMatchIndex) ??
        activePairMatches[0]
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
              第42回 週末研究会
            </h1>
            <p className="mt-3 text-sm text-(--brand-ink-muted)">
              2025/03/12 18:00 - 21:00 / オンライン
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90">
              参加者を追加
            </Button>
            <Button
              variant="outline"
              className="border-(--brand-moss)/30 bg-white/70 text-(--brand-ink) hover:bg-white"
            >
              参加者一覧
            </Button>
            <Button
              variant="outline"
              className="border-(--brand-moss)/30 bg-white/70 text-(--brand-ink) hover:bg-white"
            >
              メモを編集
            </Button>
          </div>
        </div>
      </section>

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
              {participants.length}名参加
            </p>
          </div>
          <div
            className="relative mt-4 rounded-2xl border border-border/60 bg-white/70"
            onClick={() => setOpenMenuKey(null)}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 rounded-l-2xl bg-linear-to-r from-(--brand-ink)/20 to-transparent sm:hidden" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 rounded-r-2xl bg-linear-to-l from-(--brand-ink)/20 to-transparent sm:hidden" />
            <Table className="min-w-130 border-collapse text-sm sm:min-w-160">
              <TableHeader className="bg-white/80 [&_tr]:border-border/60">
                <TableRow className="border-b border-border/60">
                  <TableHead className="bg-(--brand-ink)/5 px-3 py-3 text-left text-xs font-semibold text-(--brand-ink)">
                    自分＼相手
                  </TableHead>
                  {participants.map((participant) => (
                    <TableHead
                      key={participant.id}
                      className="whitespace-nowrap bg-(--brand-ink)/5 px-3 py-3 text-center text-xs font-semibold text-(--brand-ink)"
                      scope="col"
                      title={participant.name}
                    >
                      <span className="block sm:hidden">
                        {getNameInitial(participant.name)}
                      </span>
                      <span className="hidden sm:block">
                        {participant.name}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap border-l border-border/60 bg-(--brand-ink)/5 px-3 py-3 text-center text-xs font-semibold text-(--brand-ink)">
                    勝敗
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((rowParticipant) => {
                  const totals = getRowTotals(rowParticipant.id);
                  return (
                    <TableRow
                      key={rowParticipant.id}
                      className="border-b border-border/60 last:border-b-0"
                    >
                      <TableHead
                        scope="row"
                        className="whitespace-nowrap bg-(--brand-ink)/5 px-3 py-3 text-left text-xs font-semibold text-(--brand-ink)"
                      >
                        {rowParticipant.name}
                      </TableHead>
                      {participants.map((columnParticipant) => {
                        const cellKey = `${rowParticipant.id}-${columnParticipant.id}`;
                        const pairMatches = getPairMatches(
                          rowParticipant.id,
                          columnParticipant.id
                        );
                        const hasMatches = pairMatches.length > 0;
                        const isSelf =
                          rowParticipant.id === columnParticipant.id;
                        const isMenuOpen = openMenuKey === cellKey;
                        const cellDisplay = getCellDisplay(
                          rowParticipant.id,
                          columnParticipant.id
                        );
                        const cellLabel = `${rowParticipant.name} vs ${columnParticipant.name}: ${cellDisplay.title}`;
                        const cellTextClassName = cellDisplay.muted
                          ? "text-(--brand-ink-muted)"
                          : "text-(--brand-ink)";

                        if (isSelf) {
                          return (
                            <TableCell
                              key={cellKey}
                              className="px-3 py-3 text-center"
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`w-full cursor-default text-xs font-semibold ${cellTextClassName}`}
                                disabled
                                title={cellLabel}
                                aria-label={cellLabel}
                              >
                                {cellDisplay.text}
                              </Button>
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell
                            key={cellKey}
                            className="relative px-3 py-3 text-center"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className={`w-full rounded-lg text-xs font-semibold ${cellTextClassName}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (!hasMatches) {
                                  openDialog(
                                    "add",
                                    rowParticipant.id,
                                    columnParticipant.id
                                  );
                                  return;
                                }
                                setOpenMenuKey((prev) =>
                                  prev === cellKey ? null : cellKey
                                );
                              }}
                              title={cellLabel}
                              aria-label={
                                hasMatches
                                  ? `${rowParticipant.name} vs ${columnParticipant.name} の操作を開く`
                                  : `${rowParticipant.name} vs ${columnParticipant.name} の結果を追加`
                              }
                              aria-haspopup={hasMatches ? "menu" : "dialog"}
                              aria-expanded={hasMatches ? isMenuOpen : undefined}
                            >
                              {cellDisplay.text}
                            </Button>
                            {hasMatches && isMenuOpen ? (
                              <div
                                className="absolute left-1/2 top-full z-20 mt-2 w-36 -translate-x-1/2 rounded-xl border border-border/60 bg-white p-1 text-xs shadow-lg"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="w-full rounded-lg px-3 py-2 text-left font-semibold text-(--brand-ink) hover:bg-(--brand-ink)/5"
                                  onClick={() =>
                                    openDialog(
                                      "add",
                                      rowParticipant.id,
                                      columnParticipant.id
                                    )
                                  }
                                >
                                  追加
                                </button>
                                <button
                                  type="button"
                                  className="w-full rounded-lg px-3 py-2 text-left font-semibold text-(--brand-ink) hover:bg-(--brand-ink)/5"
                                  onClick={() =>
                                    openDialog(
                                      "edit",
                                      rowParticipant.id,
                                      columnParticipant.id
                                    )
                                  }
                                >
                                  編集
                                </button>
                                <button
                                  type="button"
                                  className="w-full rounded-lg px-3 py-2 text-left font-semibold text-(--brand-ink) hover:bg-(--brand-ink)/5"
                                  onClick={() =>
                                    openDialog(
                                      "delete",
                                      rowParticipant.id,
                                      columnParticipant.id
                                    )
                                  }
                                >
                                  削除
                                </button>
                              </div>
                            ) : null}
                          </TableCell>
                        );
                      })}
                      <TableCell className="whitespace-nowrap border-l border-border/60 bg-(--brand-ink)/5 px-3 py-3 text-center text-xs font-semibold text-(--brand-ink)">
                        {totals.wins}勝 {totals.losses}敗
                        {totals.draws ? ` ${totals.draws}分` : ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
      {activeDialog ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
          onClick={closeDialog}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border/60 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={dialogTitle}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-(--brand-ink-muted)">
                  対局結果
                </p>
                <h2 className="mt-1 text-lg font-semibold text-(--brand-ink)">
                  {dialogTitle}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-xs font-semibold text-(--brand-ink-muted) transition hover:bg-(--brand-ink)/5"
                onClick={closeDialog}
              >
                閉じる
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-border/60 bg-(--brand-ink)/5 px-3 py-2 text-sm font-semibold text-(--brand-ink)">
              {dialogRowName} × {dialogColumnName}
            </div>

            {activeDialog.mode !== "add" ? (
              <div className="mt-4">
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
                        entry.match
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

            {activeDialog.mode === "delete" ? (
              <div className="mt-4">
                <p className="text-sm text-(--brand-ink-muted)">
                  この対局結果を削除します。操作は取り消せません。
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-(--brand-ink)/20 bg-white/80 text-(--brand-ink)"
                    onClick={closeDialog}
                  >
                    キャンセル
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    削除
                  </Button>
                </div>
              </div>
            ) : (
              <form className="mt-4" onSubmit={handleDialogSubmit}>
                <label className="mt-4 block text-xs font-semibold text-(--brand-ink)">
                  結果
                </label>
                <select
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
                  <label className="text-xs font-semibold text-(--brand-ink)">
                    対局日
                  </label>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-(--brand-ink) shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    required
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
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
                  >
                    {activeDialog.mode === "add" ? "追加" : "保存"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-(--brand-ink) px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
