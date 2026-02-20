"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTooltipDateTime } from "@/lib/date-utils";
import { trpc } from "@/lib/trpc/client";

const FC_PLUGINS = [dayGridPlugin, interactionPlugin];

export type SessionExtendedProps = {
  startsAt: string | Date;
  endsAt: string | Date;
};

function isValidDateValue(value: unknown): value is string | Date {
  return typeof value === "string" || value instanceof Date;
}

export function EventWithTooltip({ arg }: { arg: EventContentArg }) {
  const { extendedProps, title } = arg.event;
  const { startsAt, endsAt } = extendedProps;

  const hasTooltipData = isValidDateValue(startsAt) && isValidDateValue(endsAt);

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
  holidayDates: string[];
};

export function buildSessionDates(events?: EventInput[]): Set<string> {
  if (!events) return new Set<string>();
  return new Set(
    events.map((e) => {
      const d = e.start;
      if (d instanceof Date) return d.toISOString().slice(0, 10);
      return typeof d === "string" ? d.slice(0, 10) : "";
    }),
  );
}

export function getDayCellClassNames(
  dateStr: string,
  sessionDates: Set<string>,
  hasDateClick: boolean,
  holidayDates: Set<string>,
): string[] {
  const classes: string[] = [];
  if (hasDateClick && !sessionDates.has(dateStr)) {
    classes.push("fc-day-clickable");
  }
  if (holidayDates.has(dateStr)) {
    classes.push("fc-day-holiday");
  }
  return classes;
}

/** 初期範囲（Provider が返す ±1年）を計算 */
function getInitialRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear() - 1, 0, 1),
    end: new Date(now.getFullYear() + 1, 11, 31),
  };
}

export function SessionCalendar({
  events,
  onDateClick,
  holidayDates,
}: SessionCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onDateClickRef = useRef(onDateClick);
  useEffect(() => {
    onDateClickRef.current = onDateClick;
  }, [onDateClick]);

  const sessionDates = useMemo(() => buildSessionDates(events), [events]);

  // 初期範囲外の祝日を動的取得するための state
  const initialRange = useMemo(() => getInitialRange(), []);
  const [dynamicRange, setDynamicRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const viewStart = arg.start;
      const viewEnd = arg.end;
      // 初期範囲外に遷移した場合のみ動的取得を行う
      if (viewStart < initialRange.start || viewEnd > initialRange.end) {
        setDynamicRange({ start: viewStart, end: viewEnd });
      }
    },
    [initialRange],
  );

  const { data: dynamicHolidays } = trpc.holidays.list.useQuery(
    {
      start: dynamicRange?.start ?? new Date(),
      end: dynamicRange?.end ?? new Date(),
    },
    { enabled: dynamicRange !== null },
  );

  // 初期 props + 動的取得結果をマージした Set
  const mergedHolidayDates = useMemo(() => {
    const set = new Set(holidayDates);
    if (dynamicHolidays) {
      for (const d of dynamicHolidays) {
        set.add(d);
      }
    }
    return set;
  }, [holidayDates, dynamicHolidays]);

  useEffect(() => {
    if (!onDateClick) return;

    const container = containerRef.current;
    if (!container) return;

    function moveFocus(cells: HTMLElement[], from: number, to: number) {
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

      // Determine if roving tabindex needs initialization:
      // either no cell has kbBound (fresh grid) or no cell has tabindex="0"
      // (can happen when FullCalendar replaces grid cells during month switch)
      const needsInit =
        cells.every((c) => !c.dataset.kbBound) ||
        !cells.some((c) => c.getAttribute("tabindex") === "0");

      if (needsInit) {
        // Set initial roving tabindex
        const todayIndex = cells.findIndex((c) =>
          c.classList.contains("fc-day-today"),
        );
        const activeIndex = todayIndex >= 0 ? todayIndex : 0;
        cells.forEach((cell, i) => {
          cell.setAttribute("tabindex", i === activeIndex ? "0" : "-1");
          if (cell.classList.contains("fc-day-today")) {
            cell.setAttribute("aria-current", "date");
          }
        });
      }

      cells.forEach((cell) => {
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
      className="[&_.fc-daygrid-day:focus-visible]:ring-2 [&_.fc-daygrid-day:focus-visible]:ring-ring [&_.fc-daygrid-day:focus-visible]:ring-offset-1 [&_.fc-daygrid-day:focus-visible]:outline-none [&_.fc-day-clickable]:cursor-pointer [&_.fc-day-clickable:hover]:bg-(--brand-moss)/10 [&_.fc-day-sat_.fc-daygrid-day-number]:text-(--brand-sky) [&_.fc-day-sat.fc-col-header-cell]:text-(--brand-sky) [&_.fc-day-sun_.fc-daygrid-day-number]:text-(--brand-holiday) [&_.fc-day-sun.fc-col-header-cell]:text-(--brand-holiday) [&_.fc-day-holiday_.fc-daygrid-day-number]:text-(--brand-holiday)"
    >
      <FullCalendar
        plugins={FC_PLUGINS}
        initialView="dayGridMonth"
        locale="ja"
        buttonHints={{ prev: "前の$0", next: "次の$0" }}
        events={events}
        dateClick={onDateClick}
        datesSet={handleDatesSet}
        dayCellClassNames={(arg) => {
          const dateStr = arg.date.toISOString().slice(0, 10);
          return getDayCellClassNames(
            dateStr,
            sessionDates,
            !!onDateClick,
            mergedHolidayDates,
          );
        }}
        eventContent={(arg) => <EventWithTooltip arg={arg} />}
      />
    </div>
  );
}
