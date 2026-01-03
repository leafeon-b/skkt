import { Button } from "@/components/ui/button";
import Link from "next/link";

const memberships = [
  { name: "京大将棋研究会", role: "オーナー", href: "/circles/demo/owner" },
  {
    name: "社会人リーグ研究会",
    role: "マネージャー",
    href: "/circles/demo/manager",
  },
];

const recentSessions = [
  {
    name: "第42回 週末研究会",
    date: "2025/03/12",
    href: "/circle-sessions/demo",
  },
  { name: "冬季対局会", date: "2025/02/11", href: "/circle-sessions/demo" },
];

const roleClasses: Record<string, string> = {
  オーナー: "bg-[color:var(--brand-gold)]/25 text-[color:var(--brand-ink)]",
  マネージャー: "bg-[color:var(--brand-sky)]/25 text-[color:var(--brand-ink)]",
  メンバー: "bg-[color:var(--brand-moss)]/20 text-[color:var(--brand-ink)]",
};

export default function UserDemoPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="mt-3 text-3xl font-[var(--font-display)] text-[color:var(--brand-ink)] sm:text-4xl">
              藤井 聡太
            </h1>
            <p className="mt-2 text-sm text-[color:var(--brand-ink-muted)]">
              研究会参加 2件 / 活動回数 8回
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
              参加中の研究会
            </p>
            <Button
              variant="ghost"
              className="text-xs text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-ink)]"
            >
              すべて見る
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {memberships.map((circle) => (
              <Link
                key={circle.name}
                href={circle.href}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
              >
                <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
                  {circle.name}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${roleClasses[circle.role] ?? "bg-[color:var(--brand-ink)]/10 text-[color:var(--brand-ink)]"}`}
                >
                  {circle.role}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
              最近参加した回
            </p>
            <Button
              variant="ghost"
              className="text-xs text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-ink)]"
            >
              すべて見る
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {recentSessions.map((session) => (
              <Link
                key={session.name}
                href={session.href}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
                    {session.name}
                  </p>
                  <p className="text-xs text-[color:var(--brand-ink-muted)]">
                    {session.date}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--brand-sky)]/20 px-2.5 py-1 text-xs text-[color:var(--brand-ink)]">
                  開催済み
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
