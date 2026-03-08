import type { PairMatchEntry } from "./match-utils";

type MatchSelectProps = {
  id?: string;
  activePairMatches: PairMatchEntry[];
  selectedMatch: PairMatchEntry | null;
  onMatchSelectChange: (nextIndex: number) => void;
  getOptionLabel: (entry: PairMatchEntry, index: number) => string;
};

export function MatchSelect({
  id,
  activePairMatches,
  selectedMatch,
  onMatchSelectChange,
  getOptionLabel,
}: MatchSelectProps) {
  if (activePairMatches.length > 1) {
    return (
      <select
        id={id}
        className="mt-2 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-(--brand-ink) shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        value={selectedMatch?.index ?? ""}
        onChange={(event) =>
          onMatchSelectChange(Number(event.target.value))
        }
      >
        {activePairMatches.map((entry, index) => (
          <option key={entry.index} value={entry.index}>
            {getOptionLabel(entry, index)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <p className="mt-2 text-sm text-(--brand-ink-muted)">
      {selectedMatch
        ? getOptionLabel(selectedMatch, 0)
        : "対局結果なし"}
    </p>
  );
}
