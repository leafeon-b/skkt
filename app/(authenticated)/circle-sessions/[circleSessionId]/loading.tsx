import { Skeleton } from "@/components/ui/skeleton";

export default function CircleSessionDetailLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-8"
      role="status"
      aria-label="読み込み中"
    >
      <span className="sr-only">セッションの詳細を読み込み中です</span>
      {/* Header Card */}
      <div className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          {/* Left Side */}
          <div className="min-w-60 flex-1">
            {/* Title + Role Badge */}
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <Skeleton className="h-9 w-2/5" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            {/* DateTime + Location */}
            <Skeleton className="mt-3 h-4 w-3/5" />
            {/* Memo */}
            <Skeleton className="mt-3 h-3 w-2/5" />
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:min-w-60 sm:max-w-[320px]">
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Match Results Table Card */}
      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Table Skeleton */}
          <div className="relative mt-4 rounded-2xl border border-border/60 bg-white/70 p-4">
            {/* Table Header Row */}
            <div className="flex gap-2 border-b border-border/60 pb-3">
              <Skeleton className="h-4 w-20 shrink-0" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-14 shrink-0" />
              ))}
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
            {/* Table Body Rows */}
            {Array.from({ length: 4 }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="flex gap-2 border-b border-border/60 py-3 last:border-b-0"
              >
                <Skeleton className="h-4 w-20 shrink-0" />
                {Array.from({ length: 4 }).map((_, colIdx) => (
                  <Skeleton key={colIdx} className="h-4 w-14 shrink-0" />
                ))}
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
