"use client";

import { SessionCalendar } from "@/components/calendar/session-calendar";
import { Button } from "@/components/ui/button";
import type { CircleOverviewSession } from "@/server/presentation/view-models/circle-overview";
import type { EventInput } from "@fullcalendar/core";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type CircleOverviewCalendarProps = {
  sessions: CircleOverviewSession[];
  createSessionHref: string | null;
};

export function CircleOverviewCalendar({
  sessions,
  createSessionHref,
}: CircleOverviewCalendarProps) {
  const events: EventInput[] = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id ?? undefined,
        title: s.title,
        start: s.startsAt,
        end: s.endsAt,
        url: s.id ? `/circle-sessions/${s.id}` : undefined,
      })),
    [sessions],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-(--brand-ink)">開催カレンダー</h2>
        {createSessionHref ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
            asChild
          >
            <Link href={createSessionHref}>
              <Plus className="size-3.5" aria-hidden="true" />
              新規作成
            </Link>
          </Button>
        ) : null}
      </div>
      <SessionCalendar events={events} />
    </div>
  );
}
