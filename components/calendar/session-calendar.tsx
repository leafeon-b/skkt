"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventContentArg, EventInput } from "@fullcalendar/core";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FC_PLUGINS = [dayGridPlugin, interactionPlugin];

const STATUS_LABEL: Record<string, string> = {
  scheduled: "予定",
  done: "終了",
  draft: "下書き",
};

function formatTooltipDateTime(startsAt: unknown, endsAt: unknown): string {
  const toDate = (v: unknown): Date | null => {
    if (v instanceof Date) return v;
    if (typeof v === "string" || typeof v === "number") return new Date(v);
    return null;
  };

  const start = toDate(startsAt);
  const end = toDate(endsAt);
  if (!start || !end) return "";

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const date = `${start.getFullYear()}/${pad2(start.getMonth() + 1)}/${pad2(start.getDate())}`;
  const startTime = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
  const endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;

  return `${date} ${startTime} - ${endTime}`;
}

function EventWithTooltip({ arg }: { arg: EventContentArg }) {
  const { extendedProps, title } = arg.event;
  const status = extendedProps.status as string | undefined;
  const startsAt = extendedProps.startsAt;
  const endsAt = extendedProps.endsAt;

  const hasTooltipData = status && startsAt && endsAt;

  if (!hasTooltipData) {
    return <span className="truncate">{title}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block truncate">{title}</span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        <div className="space-y-0.5 text-left">
          <p className="font-semibold">{title}</p>
          <p>{formatTooltipDateTime(startsAt, endsAt)}</p>
          <p>ステータス: {STATUS_LABEL[status] ?? status}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

type SessionCalendarProps = {
  events?: EventInput[];
  onDateClick?: (arg: DateClickArg) => void;
};

export function SessionCalendar({
  events,
  onDateClick,
}: SessionCalendarProps) {
  return (
    <FullCalendar
      plugins={FC_PLUGINS}
      initialView="dayGridMonth"
      locale="ja"
      events={events}
      dateClick={onDateClick}
      eventContent={(arg) => <EventWithTooltip arg={arg} />}
    />
  );
}
