import { Button } from "@/components/ui/button";
import CircleCreateDemo from "@/app/(authenticated)/home/circle-create-demo";
import Link from "next/link";

const recentCircleSessions = [
  { name: "第42回 週末研究会", note: "先週・出席 14名" },
  { name: "春季対局会", note: "今月・出席 22名" },
  { name: "新歓トライアル", note: "今月・出席 9名" },
];

export default function Home() {
  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-4 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-gold)_0,transparent_68%)] blur-3xl motion-safe:animate-[glow_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-sky)_0,transparent_65%)] blur-3xl motion-safe:animate-[glow_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-size-[32px_32px]" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Link
          href="/circle-sessions/demo"
          className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm transition hover:border-border hover:bg-white hover:shadow-sm motion-safe:animate-[rise_0.7s_ease-out]"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-(--brand-ink)">次回日程</p>
            <span className="rounded-full bg-(--brand-gold)/20 px-3 py-1 text-xs text-(--brand-ink)">
              2026/03/12
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-(--brand-ink)">
            第42回 週末研究会
          </p>
          <p className="mt-2 text-sm text-(--brand-ink-muted)">
            18:00 - 21:00 / オンライン
          </p>
        </Link>

        <div
          className="flex items-center rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm motion-safe:animate-[rise_0.7s_ease-out]"
          style={{ animationDelay: "140ms" }}
        >
          <CircleCreateDemo />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-(--brand-ink)">
              最近参加した回
            </p>
            <Button
              variant="ghost"
              className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
            >
              すべて見る
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {recentCircleSessions.map((session) => (
              <Link
                key={session.name}
                href="/circle-sessions/demo"
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-(--brand-ink)">
                    {session.name}
                  </p>
                  <p className="text-xs text-(--brand-ink-muted)">
                    {session.note}
                  </p>
                </div>
                <span className="rounded-full bg-(--brand-sky)/20 px-2.5 py-1 text-xs text-(--brand-ink)">
                  参加中
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
