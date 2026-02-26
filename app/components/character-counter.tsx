type CharacterCounterProps = {
  count: number;
  max: number;
  label: string;
};

export function CharacterCounter({ count, max, label }: CharacterCounterProps) {
  const ratio = count / max;

  return (
    <p
      className={`mt-1 text-right text-xs ${
        count >= max
          ? "text-destructive"
          : ratio >= 0.8
            ? "text-amber-600"
            : "text-(--brand-ink-muted)"
      }`}
      aria-live={ratio >= 0.8 ? "polite" : "off"}
      aria-label={label}
    >
      {count} / {max}
    </p>
  );
}
