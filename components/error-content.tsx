"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorContentProps = {
  error: Error & { digest?: string };
  reset: () => void;
  className?: string;
};

export function ErrorContent({ error, reset, className }: ErrorContentProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6",
        className,
      )}
    >
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-6xl font-bold text-destructive">Error</h1>
        <h2 className="text-2xl font-(--font-display) text-(--brand-ink)">
          エラーが発生しました
        </h2>
        <p className="text-sm leading-relaxed text-(--brand-ink-muted)">
          予期しないエラーが発生しました。再試行するか、しばらくしてからもう一度お試しください。
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left">
            <p className="text-xs font-semibold text-destructive">
              開発環境のみ表示
            </p>
            <p className="mt-2 break-all font-mono text-xs text-(--brand-ink-muted)">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-xs text-(--brand-ink-muted)">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="bg-(--brand-moss) hover:bg-(--brand-moss)/90"
          >
            再試行
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">ホームに戻る</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
