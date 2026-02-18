import { formatDateForInput } from "@/lib/date-utils";
import type {
  CircleSessionMatch,
  CircleSessionMatchOutcome,
} from "@/server/presentation/view-models/circle-session-detail";

export type RowOutcome = "ROW_WIN" | "ROW_LOSS" | "DRAW" | "UNKNOWN";
export type DialogMode = "add" | "edit" | "delete";
export type PairMatchEntry = {
  match: CircleSessionMatch;
  index: number;
};
export type ActiveDialog = {
  mode: DialogMode;
  rowId: string;
  columnId: string;
};

export const getTodayInputValue = () => formatDateForInput(new Date());

export const convertRowOutcomeToApiOutcome = (
  rowOutcome: RowOutcome,
  rowId: string,
  player1Id: string,
): CircleSessionMatchOutcome => {
  if (rowOutcome === "DRAW") return "DRAW";
  if (rowOutcome === "UNKNOWN") return "UNKNOWN";
  const rowIsPlayer1 = rowId === player1Id;
  if (rowOutcome === "ROW_WIN") return rowIsPlayer1 ? "P1_WIN" : "P2_WIN";
  return rowIsPlayer1 ? "P2_WIN" : "P1_WIN";
};

export const getNameInitial = (name: string) =>
  Array.from(name.trim())[0] ?? name;

export const getOutcomeLabel = (
  outcome: RowOutcome,
  rowName: string,
  columnName: string,
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

export const getRowOutcomeValue = (
  rowId: string,
  match: {
    player1Id: string;
    player2Id: string;
    outcome: CircleSessionMatchOutcome;
  },
): RowOutcome => {
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

export const getMatchOutcome = (
  rowId: string,
  match: {
    player1Id: string;
    player2Id: string;
    outcome: CircleSessionMatchOutcome;
  },
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

export const getPairMatches = (
  matches: CircleSessionMatch[],
  rowId: string,
  columnId: string,
): PairMatchEntry[] =>
  matches
    .map((match, index) => ({ match, index }))
    .filter(
      ({ match }) =>
        (match.player1Id === rowId && match.player2Id === columnId) ||
        (match.player1Id === columnId && match.player2Id === rowId),
    );
