import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-6xl font-bold text-(--brand-moss)">404</h1>
        <h2 className="text-2xl font-(--font-display) text-(--brand-ink)">
          ページが見つかりません
        </h2>
        <p className="text-sm leading-relaxed text-(--brand-ink-muted)">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Button
          asChild
          className="bg-(--brand-moss) hover:bg-(--brand-moss)/90"
        >
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    </div>
  );
}
