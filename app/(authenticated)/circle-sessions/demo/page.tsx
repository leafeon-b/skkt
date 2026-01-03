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

const participants = [
  { id: "p1", name: "藤井 聡太" },
  { id: "p2", name: "豊島 将之" },
  { id: "p3", name: "永瀬 拓矢" },
  { id: "p4", name: "佐々木 勇気" },
  { id: "p5", name: "伊藤 匠" },
  { id: "p6", name: "菅井 竜也" },
];

const matches: Array<{
  player1Id: string;
  player2Id: string;
  outcome: MatchOutcome;
}> = [
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

  const pairMatches = matches.filter(
    (match) =>
      (match.player1Id === rowId && match.player2Id === columnId) ||
      (match.player1Id === columnId && match.player2Id === rowId)
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
          <div className="relative mt-4 rounded-2xl border border-border/60 bg-white/70">
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
                        return (
                          <TableCell
                            key={`${rowParticipant.id}-${columnParticipant.id}`}
                            className="px-3 py-3 text-center"
                          >
                            {(() => {
                              const cell = getCellResults(
                                rowParticipant.id,
                                columnParticipant.id
                              );

                              if (cell.type === "aggregate") {
                                return (
                                  <span
                                    className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-(--brand-ink)/10 px-2 py-1 text-xs font-semibold text-(--brand-ink)"
                                    title={`${rowParticipant.name} vs ${columnParticipant.name}: ${cell.title}`}
                                    aria-label={`${rowParticipant.name} vs ${columnParticipant.name}: ${cell.title}`}
                                  >
                                    {cell.label}
                                  </span>
                                );
                              }

                              return (
                                <span className="inline-flex items-center justify-center gap-1">
                                  {cell.results.map((result, index) => (
                                    <span
                                      key={`${rowParticipant.id}-${columnParticipant.id}-${index}`}
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${result.className}`}
                                      title={`${rowParticipant.name} vs ${columnParticipant.name}: ${result.title}`}
                                      aria-label={`${rowParticipant.name} vs ${columnParticipant.name}: ${result.title}`}
                                    >
                                      {result.label}
                                    </span>
                                  ))}
                                </span>
                              );
                            })()}
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
    </div>
  );
}
