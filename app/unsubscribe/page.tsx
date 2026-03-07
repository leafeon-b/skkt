import Footer from "@/app/components/footer";
import { isValidUnsubscribeToken } from "@/server/domain/common/token-validation";
import Link from "next/link";
import { UnsubscribeForm } from "./unsubscribe-form";

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;

  const hasValidToken = !!token && isValidUnsubscribeToken(token);

  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-white/85 p-8 shadow-sm">
          {!token && (
            <>
              <h1 className="mb-4 text-xl font-bold text-(--brand-ink)">
                配信停止
              </h1>
              <p className="text-sm text-(--brand-ink-muted)">
                無効なリンクです。メールに記載されたリンクからアクセスしてください。
              </p>
            </>
          )}

          {token && !hasValidToken && (
            <>
              <h1 className="mb-4 text-xl font-bold text-(--brand-ink)">
                配信停止
              </h1>
              <p className="mb-6 text-sm text-red-600">
                無効なトークンです。
              </p>
              <p className="text-sm text-(--brand-ink-muted)">
                問題が解決しない場合は、
                <Link
                  href="/account"
                  className="text-(--brand-moss) underline hover:opacity-80"
                >
                  ログインしてアカウント設定
                </Link>
                からメール通知を無効にしてください。
              </p>
            </>
          )}

          {hasValidToken && <UnsubscribeForm token={token} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
