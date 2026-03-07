import Footer from "@/app/components/footer";
import { buildServiceContainer } from "@/server/presentation/trpc/context";
import { DomainError } from "@/server/domain/common/errors";
import { isValidUnsubscribeToken } from "@/server/domain/common/token-validation";
import Link from "next/link";

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

type UnsubscribeResult =
  | { status: "success" }
  | { status: "error"; message: string };

const { notificationPreferenceService } = buildServiceContainer();

async function unsubscribe(token: string): Promise<UnsubscribeResult> {
  if (!isValidUnsubscribeToken(token)) {
    return { status: "error", message: "無効なトークンです。" };
  }

  try {
    const result =
      await notificationPreferenceService.disableByToken(token);
    if (!result) {
      return { status: "error", message: "無効なトークンです。" };
    }
    return { status: "success" };
  } catch (error) {
    if (error instanceof DomainError) {
      return { status: "error", message: error.message };
    }
    console.error("Unhandled error in unsubscribe page:", error);
    return {
      status: "error",
      message: "配信停止の処理中にエラーが発生しました。",
    };
  }
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;

  const result: UnsubscribeResult | null = token
    ? await unsubscribe(token)
    : null;

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

          {result?.status === "success" && (
            <>
              <h1 className="mb-4 text-xl font-bold text-(--brand-ink)">
                配信停止完了
              </h1>
              <p className="mb-6 text-sm text-(--brand-ink-muted)">
                メール配信を停止しました。今後、通知メールは届きません。
              </p>
              <p className="text-sm text-(--brand-ink-muted)">
                設定を変更したい場合は、
                <Link
                  href="/account"
                  className="text-(--brand-moss) underline hover:opacity-80"
                >
                  ログインしてアカウント設定
                </Link>
                から変更できます。
              </p>
            </>
          )}

          {result?.status === "error" && (
            <>
              <h1 className="mb-4 text-xl font-bold text-(--brand-ink)">
                配信停止
              </h1>
              <p className="mb-6 text-sm text-red-600">{result.message}</p>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
