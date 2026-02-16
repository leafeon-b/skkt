const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;

export const formatTime = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export const formatDateTimeRange = (startsAt: Date, endsAt: Date) =>
  `${formatDate(startsAt)} ${formatTime(startsAt)} - ${formatTime(endsAt)}`;

export const formatDateForInput = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const formatDateTimeForInput = (date: Date) =>
  `${formatDateForInput(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

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
