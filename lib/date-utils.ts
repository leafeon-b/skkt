const jstDateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const jstTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const formatDate = (date: Date) => jstDateFormat.format(date);

export const formatTime = (date: Date) => jstTimeFormat.format(date);

export const formatDateTimeRange = (startsAt: Date, endsAt: Date) =>
  `${formatDate(startsAt)} ${formatTime(startsAt)} - ${formatTime(endsAt)}`;

export const formatDateForInput = (date: Date) =>
  date.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

export const formatDateTimeForInput = (date: Date) => {
  const timePart = date.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${formatDateForInput(date)}T${timePart}`;
};

export function formatTooltipDateTime(
  startsAt: string | Date,
  endsAt: string | Date,
): string {
  const toDate = (v: string | Date): Date =>
    v instanceof Date ? v : new Date(v);

  const start = toDate(startsAt);
  const end = toDate(endsAt);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

  return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
}
