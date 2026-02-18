"use client";

import CircleCreateForm from "@/app/(authenticated)/home/circle-create-form";
import {
  SessionCalendar,
  type SessionExtendedProps,
} from "@/components/calendar/session-calendar";
import { formatDate, formatTime } from "@/lib/date-utils";
import type { HomeViewModel } from "@/server/presentation/view-models/home";
import type { EventInput } from "@fullcalendar/core";
import Link from "next/link";
import { useMemo } from "react";

export function HomeView({ viewModel }: { viewModel: HomeViewModel }) {
  const { nextSession } = viewModel;

  const calendarEvents: EventInput[] = useMemo(
    () =>
      viewModel.calendarEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        url: e.url,
        extendedProps: {
          startsAt: e.start,
          endsAt: e.end,
        } satisfies SessionExtendedProps,
      })),
    [viewModel.calendarEvents],
  );

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-4 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-gold)_0,transparent_68%)] blur-3xl motion-safe:animate-[glow_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-sky)_0,transparent_65%)] blur-3xl motion-safe:animate-[glow_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-size-[32px_32px]" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {nextSession ? (
          <Link
            href={`/circle-sessions/${nextSession.circleSessionId}`}
            className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm transition hover:border-border hover:bg-white hover:shadow-sm motion-safe:animate-[rise_0.7s_ease-out]"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-(--brand-ink)">
                次回予定
              </p>
              <span className="rounded-full bg-(--brand-gold)/20 px-3 py-1 text-xs text-(--brand-ink)">
                {formatDate(new Date(nextSession.startsAt))}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-(--brand-ink)">
              {nextSession.title}
            </p>
            <p className="mt-2 text-sm text-(--brand-ink-muted)">
              {formatTime(new Date(nextSession.startsAt))} -{" "}
              {formatTime(new Date(nextSession.endsAt))} /{" "}
              {nextSession.location ?? "場所未定"}
            </p>
          </Link>
        ) : (
          <div
            className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm motion-safe:animate-[rise_0.7s_ease-out]"
            style={{ animationDelay: "80ms" }}
          >
            <p className="text-sm font-semibold text-(--brand-ink)">次回予定</p>
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
            カレンダー
          </p>
          <SessionCalendar events={calendarEvents} />
        </div>
      </section>
    </div>
  );
}
