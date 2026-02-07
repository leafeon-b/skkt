export default function HelpPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
          SKKTについて
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-(--brand-ink-muted) sm:text-base">
          SKKT(将棋研究会管理ツール)は研究会の活動記録を効率的に行うための記録ツールです。
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-(--brand-ink)">
          使い方のポイント
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-(--brand-ink-muted)">
          <li>・研究会のメンバーと日程を、まとめて迷わず整理できます。</li>
          <li>・対局結果は、その場ですぐ残せます。</li>
          <li>・記録はメンバー全員に行き渡り、共有がスムーズです。</li>
          <li>・自分の記録を可視化し、次の活動に活かせます。</li>
        </ul>
      </section>
    </div>
  );
}
