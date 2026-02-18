import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
      role="status"
      aria-label="読み込み中"
    >
      <span className="sr-only">アカウント設定を読み込み中です</span>

      <Skeleton className="h-8 w-40" />

      {/* Profile Section */}
      <div className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm">
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-9 w-16 self-start rounded-md" />
        </div>
      </div>

      {/* Password Section */}
      <div className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-9 w-32 self-start rounded-md" />
        </div>
      </div>
    </div>
  );
}
