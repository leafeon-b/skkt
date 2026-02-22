import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfileLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
      role="status"
      aria-label="読み込み中"
    >
      <span className="sr-only">ユーザー情報を読み込み中です</span>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      </section>
    </div>
  );
}
