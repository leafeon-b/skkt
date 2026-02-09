"use client";

import CircleCreateForm from "@/app/(authenticated)/home/circle-create-form";
import { SessionCalendar } from "@/components/calendar/session-calendar";
import Link from "next/link";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import type { EventInput } from "@fullcalendar/core";

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;

const formatTime = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export default function Home() {
  const sessionsQuery =
    trpc.users.circleSessions.participations.list.useQuery({});

  const nextSession = useMemo(() => {
    const sessions = sessionsQuery.data;
    if (!sessions) return null;

    const now = new Date();
    const upcoming = sessions
      .filter((s) => s.startsAt > now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    return upcoming[0] ?? null;
  }, [sessionsQuery.data]);

  const calendarEvents: EventInput[] = useMemo(() => {
    const sessions = sessionsQuery.data;
    if (!sessions) return [];

    return sessions.map((s) => ({
      id: s.circleSessionId,
      title: s.title,
      start: s.startsAt,
      end: s.endsAt,
      url: `/circle-sessions/${s.circleSessionId}`,
    }));
  }, [sessionsQuery.data]);

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-4 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-gold)_0,transparent_68%)] blur-3xl motion-safe:animate-[glow_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-sky)_0,transparent_65%)] blur-3xl motion-safe:animate-[glow_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-size-[32px_32px]" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {sessionsQuery.isLoading ? (
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
          <CircleCreateForm />
        </div>
      </section>

      <section>
        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-(--brand-ink)">
            参加した回
          </p>
          {sessionsQuery.isLoading ? (
            <p className="text-sm text-(--brand-ink-muted)">読み込み中...</p>
          ) : (
            <SessionCalendar events={calendarEvents} />
          )}
        </div>
      </section>
    </div>
  );
}
