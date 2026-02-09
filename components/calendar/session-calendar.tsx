"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";

const FC_PLUGINS = [dayGridPlugin, interactionPlugin];

type SessionCalendarProps = {
  events?: EventInput[];
  onDateClick?: (arg: DateClickArg) => void;
};

export function SessionCalendar({ events, onDateClick }: SessionCalendarProps) {
  return (
    <FullCalendar
      plugins={FC_PLUGINS}
      initialView="dayGridMonth"
      locale="ja"
      events={events}
      dateClick={onDateClick}
    />
  );
}
