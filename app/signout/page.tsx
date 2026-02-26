"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCsrfToken } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  const [csrfToken, setCsrfToken] = useState<string>();
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    getCsrfToken()
      .then((token) => setCsrfToken(token ?? undefined))
      .catch(() => setTokenError(true));
  }, []);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold text-(--brand-moss)">ログアウト</h1>
        <h2 className="text-2xl font-(--font-display) text-(--brand-ink)">
          ログアウトしますか？
        </h2>
        {tokenError && (
          <p className="text-sm text-red-600">
            トークンの取得に失敗しました。ページを再読み込みしてください。
          </p>
        )}
        <form method="post" action="/api/auth/signout">
          {csrfToken && (
            <input type="hidden" name="csrfToken" value={csrfToken} />
          )}
          <input type="hidden" name="callbackUrl" value="/" />
          <div className="flex flex-col items-center gap-3">
            <Button
              type="submit"
              className="w-full bg-(--brand-moss) hover:bg-(--brand-moss)/90"
              disabled={!csrfToken}
            >
              ログアウト
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full border-(--brand-moss) text-(--brand-moss)"
            >
              <Link href="/">キャンセル</Link>
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
