import dynamic from "next/dynamic";
import { CalendarSkeleton } from "./calendar-skeleton";

export const SessionCalendar = dynamic(
  () => import("./session-calendar").then((m) => m.SessionCalendar),
  { ssr: false, loading: () => <CalendarSkeleton /> },
);

export type { SessionExtendedProps } from "./session-calendar";
