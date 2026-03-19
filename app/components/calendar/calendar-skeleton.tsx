import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div className="session-calendar" aria-hidden="true">
      {/* Header: prev / title / next */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Day-of-week header */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="mx-auto h-4 w-6" />
        ))}
      </div>

      {/* 5 rows of day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
