"use client";

import { useEffect, useRef } from "react";
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

export type SessionExtendedProps = {
  startsAt: string | Date;
  endsAt: string | Date;
};

export function formatTooltipDateTime(
  startsAt: string | Date,
  endsAt: string | Date,
): string {
  const toDate = (v: string | Date): Date =>
    v instanceof Date ? v : new Date(v);

  const start = toDate(startsAt);
  const end = toDate(endsAt);

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const date = `${start.getFullYear()}/${pad2(start.getMonth() + 1)}/${pad2(start.getDate())}`;
  const startTime = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
  const endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;

  return `${date} ${startTime} - ${endTime}`;
}

export function EventWithTooltip({ arg }: { arg: EventContentArg }) {
  const { extendedProps, title } = arg.event;
  const { startsAt, endsAt } = extendedProps as SessionExtendedProps;

  const hasTooltipData = startsAt && endsAt;

  if (!hasTooltipData) {
    return <span className="truncate">{title}</span>;
  }

  const dateTimeLabel = formatTooltipDateTime(startsAt, endsAt);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block truncate">
          {title}
          <span className="sr-only">{`, ${dateTimeLabel}`}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        <div className="space-y-0.5 text-left">
          <p className="font-semibold">{title}</p>
          <p>{dateTimeLabel}</p>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const onDateClickRef = useRef(onDateClick);
  useEffect(() => {
    onDateClickRef.current = onDateClick;
  }, [onDateClick]);

  useEffect(() => {
    if (!onDateClick) return;

    const container = containerRef.current;
    if (!container) return;

    function moveFocus(
      cells: HTMLElement[],
      from: number,
      to: number,
    ) {
      if (to < 0 || to >= cells.length) return;
      cells[from].setAttribute("tabindex", "-1");
      cells[to].setAttribute("tabindex", "0");
      cells[to].focus();
    }

    const COLS = 7;

    function applyKeyboardSupport() {
      const cells = Array.from(
        container!.querySelectorAll<HTMLElement>(".fc-daygrid-day"),
      );
      if (cells.length === 0) return;

      // Determine if this is a fresh grid (no cell has kbBound yet)
      const isFreshGrid = cells.every((c) => !c.dataset.kbBound);

      if (isFreshGrid) {
        // Set initial roving tabindex
        const todayIndex = cells.findIndex((c) =>
          c.classList.contains("fc-day-today"),
        );
        const activeIndex = todayIndex >= 0 ? todayIndex : 0;
        cells.forEach((cell, i) => {
          cell.setAttribute(
            "tabindex",
            i === activeIndex ? "0" : "-1",
          );
          if (cell.classList.contains("fc-day-today")) {
            cell.setAttribute("aria-current", "date");
          }
        });
      }

      cells.forEach((cell, idx) => {
        if (cell.dataset.kbBound) return;
        cell.dataset.kbBound = "true";
        cell.addEventListener("keydown", (e) => {
          const currentCells = Array.from(
            container!.querySelectorAll<HTMLElement>(".fc-daygrid-day"),
          );
          const currentIdx = currentCells.indexOf(cell);
          if (currentIdx === -1) return;

          switch (e.key) {
            case "ArrowLeft":
              e.preventDefault();
              moveFocus(currentCells, currentIdx, currentIdx - 1);
              break;
            case "ArrowRight":
              e.preventDefault();
              moveFocus(currentCells, currentIdx, currentIdx + 1);
              break;
            case "ArrowUp":
              e.preventDefault();
              moveFocus(currentCells, currentIdx, currentIdx - COLS);
              break;
            case "ArrowDown":
              e.preventDefault();
              moveFocus(currentCells, currentIdx, currentIdx + COLS);
              break;
            case "Home":
              e.preventDefault();
              moveFocus(
                currentCells,
                currentIdx,
                currentIdx - (currentIdx % COLS),
              );
              break;
            case "End":
              e.preventDefault();
              moveFocus(
                currentCells,
                currentIdx,
                currentIdx - (currentIdx % COLS) + COLS - 1,
              );
              break;
            case "Enter":
            case " ": {
              e.preventDefault();
              const dateStr = cell.getAttribute("data-date");
              if (dateStr && onDateClickRef.current) {
                onDateClickRef.current({
                  date: new Date(dateStr),
                  dateStr,
                  allDay: true,
                  dayEl: cell,
                  jsEvent: e as unknown as MouseEvent,
                  view: {} as DateClickArg["view"],
                });
              }
              break;
            }
          }
        });
      });
    }

    applyKeyboardSupport();

    const observer = new MutationObserver(() => {
      applyKeyboardSupport();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [onDateClick]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="開催カレンダー"
      className="[&_.fc-daygrid-day:focus-visible]:ring-2 [&_.fc-daygrid-day:focus-visible]:ring-ring [&_.fc-daygrid-day:focus-visible]:ring-offset-1 [&_.fc-daygrid-day:focus-visible]:outline-none"
    >
      <FullCalendar
        plugins={FC_PLUGINS}
        initialView="dayGridMonth"
        locale="ja"
        events={events}
        dateClick={onDateClick}
        eventContent={(arg) => <EventWithTooltip arg={arg} />}
      />
    </div>
  );
}
