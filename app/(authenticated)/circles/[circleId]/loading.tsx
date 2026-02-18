import { Skeleton } from "@/components/ui/skeleton";

export default function CircleDetailLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-8"
      role="status"
      aria-label="読み込み中"
    >
      <span className="sr-only">研究会の詳細を読み込み中です</span>
      {/* Hero Card */}
      <div className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-60 flex-1">
            {/* Title + Role Badge */}
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <Skeleton className="h-9 w-2/5" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            {/* Schedule text */}
            <Skeleton className="mt-3 h-4 w-3/5" />
            {/* Next session card */}
            <div className="mt-4">
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Calendar Card */}
        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

        {/* Members Card */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
