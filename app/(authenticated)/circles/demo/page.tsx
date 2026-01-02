import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const members = [
  { name: "藤井 聡太", role: "オーナー" },
  { name: "羽生 善治", role: "マネージャー" },
  { name: "渡辺 明", role: "マネージャー" },
  { name: "伊藤 匠", role: "メンバー" },
];

const roleClasses: Record<string, string> = {
  オーナー: "bg-(--brand-gold)/25 text-(--brand-ink)",
  マネージャー: "bg-(--brand-sky)/25 text-(--brand-ink)",
  メンバー: "bg-(--brand-moss)/20 text-(--brand-ink)",
};

const sessions = [
  { title: "第42回 週末研究会", date: "2025/03/12", status: "開催済み" },
  { title: "第41回 週末研究会", date: "2025/02/26", status: "開催済み" },
  { title: "冬季対局会", date: "2025/02/11", status: "開催済み" },
];

const sessionStatusClasses: Record<string, string> = {
  開催済み: "bg-(--brand-moss)/15 text-(--brand-ink)",
  予定: "bg-(--brand-sky)/20 text-(--brand-ink)",
  準備中: "bg-(--brand-gold)/20 text-(--brand-ink)",
};

type CircleDemoPageProps = {
  heroContent?: ReactNode;
};

export default function CircleDemoPage({ heroContent }: CircleDemoPageProps) {
  const fallbackHero = (
    <>
      <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
        京大将棋研究会
      </h1>
      <p className="mt-3 text-sm text-(--brand-ink-muted)">
        参加者 28名 / 毎週土曜 18:00 - 21:00
      </p>
    </>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            {heroContent ?? fallbackHero}
            <Link
              href="/circle-sessions/demo"
              className="mt-4 block rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm transition hover:border-border hover:bg-white hover:shadow-sm"
            >
              <p className="text-xs font-semibold text-(--brand-ink)">
                次回日程
              </p>
              <p className="mt-1 text-(--brand-ink-muted)">
                2026/03/26 18:00 - 21:00 / オンライン
              </p>
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90">
              開催日程を追加
            </Button>
            <Button
              variant="outline"
              className="border-(--brand-moss)/30 bg-white/70 text-(--brand-ink) hover:bg-white"
            >
              メンバー管理
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-(--brand-ink)">
              最近の開催
            </p>
            <Button
              variant="ghost"
              className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
            >
              すべて見る
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.title}
                href="/circle-sessions/demo"
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-(--brand-ink)">
                    {session.title}
                  </p>
                  <p className="text-xs text-(--brand-ink-muted)">
                    {session.date}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    sessionStatusClasses[session.status] ??
                    "bg-(--brand-ink)/10 text-(--brand-ink)"
                  }`}
                >
                  {session.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-(--brand-ink)">
              参加メンバー
            </p>
            <Button
              variant="ghost"
              className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
            >
              すべて見る
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <Link
                key={member.name}
                href="/users/demo"
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-(--brand-ink)">
                    {member.name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    roleClasses[member.role] ??
                    "bg-(--brand-ink)/10 text-(--brand-ink)"
                  }`}
                >
                  {member.role}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
