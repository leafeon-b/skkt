"use client";

import { Button } from "@/components/ui/button";
import CircleCreateDemo from "@/app/(authenticated)/home/circle-create-demo";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const sessionStatusLabels: Record<string, string> = {
  done: "開催済み",
  scheduled: "予定",
  draft: "準備中",
};

const sessionStatusClasses: Record<string, string> = {
  done: "bg-(--brand-moss)/20 text-(--brand-ink)",
  scheduled: "bg-(--brand-sky)/20 text-(--brand-ink)",
  draft: "bg-(--brand-gold)/20 text-(--brand-ink)",
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;

const formatTime = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export default function Home() {
  const recentSessionsQuery =
    trpc.users.circleSessions.participations.list.useQuery({ limit: 3 });
  const recentCircleSessions = recentSessionsQuery.data ?? [];

  const upcomingSessionsQuery =
    trpc.users.circleSessions.participations.list.useQuery({ limit: 20 });

  const nextSession = (() => {
    const sessions = upcomingSessionsQuery.data;
    if (!sessions) return null;

    const now = new Date();
    const upcoming = sessions
      .filter((s) => s.startsAt > now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    return upcoming[0] ?? null;
  })();

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-4 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-gold)_0,transparent_68%)] blur-3xl motion-safe:animate-[glow_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-sky)_0,transparent_65%)] blur-3xl motion-safe:animate-[glow_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-size-[32px_32px]" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {upcomingSessionsQuery.isLoading ? (
          <div
            className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm motion-safe:animate-[rise_0.7s_ease-out]"
            style={{ animationDelay: "80ms" }}
          >
            <p className="text-sm font-semibold text-(--brand-ink)">次回日程</p>
            <p className="mt-3 text-sm text-(--brand-ink-muted)">
              読み込み中...
            </p>
          </div>
        ) : nextSession ? (
          <Link
            href={`/circle-sessions/${nextSession.circleSessionId}`}
            className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm transition hover:border-border hover:bg-white hover:shadow-sm motion-safe:animate-[rise_0.7s_ease-out]"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-(--brand-ink)">
                次回日程
              </p>
              <span className="rounded-full bg-(--brand-gold)/20 px-3 py-1 text-xs text-(--brand-ink)">
                {formatDate(nextSession.startsAt)}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-(--brand-ink)">
              {nextSession.title}
            </p>
            <p className="mt-2 text-sm text-(--brand-ink-muted)">
              {formatTime(nextSession.startsAt)} -{" "}
              {formatTime(nextSession.endsAt)} /{" "}
              {nextSession.location ?? "場所未定"}
            </p>
          </Link>
        ) : (
          <div
            className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm motion-safe:animate-[rise_0.7s_ease-out]"
            style={{ animationDelay: "80ms" }}
          >
            <p className="text-sm font-semibold text-(--brand-ink)">次回日程</p>
            <p className="mt-3 text-sm text-(--brand-ink-muted)">
              予定されている研究会はありません
            </p>
          </div>
        )}

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
            {recentSessionsQuery.isLoading ? (
              <p className="text-sm text-(--brand-ink-muted)">読み込み中...</p>
            ) : recentSessionsQuery.isError ? (
              <p className="text-sm text-(--brand-ink-muted)">
                最近参加した回を取得できませんでした
              </p>
            ) : recentCircleSessions.length === 0 ? (
              <p className="text-sm text-(--brand-ink-muted)">
                最近参加した回はまだありません
              </p>
            ) : (
              recentCircleSessions.map((session) => {
                const statusLabel =
                  sessionStatusLabels[session.status] ?? "参加中";
                const statusClass =
                  sessionStatusClasses[session.status] ??
                  "bg-(--brand-ink)/10 text-(--brand-ink)";

                return (
                  <Link
                    key={session.circleSessionId}
                    href={`/circle-sessions/${session.circleSessionId}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-(--brand-ink)">
                        {session.title}
                      </p>
                      <p className="text-xs text-(--brand-ink-muted)">
                        {formatDate(session.startsAt)} / {session.circleName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
