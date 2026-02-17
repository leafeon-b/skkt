"use client";

import {
  SessionCalendar,
  type SessionExtendedProps,
} from "@/components/calendar/session-calendar";
import { Button } from "@/components/ui/button";
import type { CircleOverviewSession } from "@/server/presentation/view-models/circle-overview";
import type { EventInput } from "@fullcalendar/core";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

type CircleOverviewCalendarProps = {
  sessions: CircleOverviewSession[];
  createSessionHref: string | null;
};

export function CircleOverviewCalendar({
  sessions,
  createSessionHref,
}: CircleOverviewCalendarProps) {
  const router = useRouter();

  const events: EventInput[] = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id ?? undefined,
        title: s.title,
        start: s.startsAt,
        end: s.endsAt,
        url: s.id ? `/circle-sessions/${s.id}` : undefined,
        extendedProps: {
          startsAt: s.startsAt,
          endsAt: s.endsAt,
        } satisfies SessionExtendedProps,
      })),
    [sessions],
  );

  const handleDateClick = useCallback(
    (arg: { dateStr: string }) => {
      if (!createSessionHref) return;
      const clickedDate = arg.dateStr;
      const hasSession = events.some((e) => {
        if (!e.start) return false;
        const eventDate =
          typeof e.start === "string"
            ? e.start.slice(0, 10)
            : e.start instanceof Date
              ? e.start.toISOString().slice(0, 10)
              : String(e.start).slice(0, 10);
        return eventDate === clickedDate;
      });
      if (hasSession) return;
      router.push(`${createSessionHref}?startsAt=${clickedDate}`);
    },
    [createSessionHref, events, router],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-(--brand-ink)">
          開催カレンダー
        </h2>
        {createSessionHref ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
            asChild
          >
            <Link href={createSessionHref}>
              <Plus className="size-3.5" aria-hidden="true" />
              予定の作成
            </Link>
          </Button>
        ) : null}
      </div>
      <SessionCalendar
        events={events}
        onDateClick={createSessionHref ? handleDateClick : undefined}
      />
    </div>
  );
}
