import Link from "next/link";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  Configuration:
    "サーバーの設定に問題があります。管理者にお問い合わせください。",
  AccessDenied: "アクセスが拒否されました。",
  Verification: "認証リンクの有効期限が切れたか、既に使用されています。",
  OAuthAccountNotLinked:
    "このメールアドレスは別のログイン方法で登録されています。元のログイン方法でサインインしてください。",
  Default: "認証中にエラーが発生しました。",
};

export default async function AuthErrorPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const errorType = searchParams.error ?? "Default";
  const message = Object.hasOwn(errorMessages, errorType)
    ? errorMessages[errorType]
    : errorMessages.Default;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold text-(--brand-moss)">エラー</h1>
        <h2 className="text-2xl font-(--font-display) text-(--brand-ink)">
          認証エラー
        </h2>
        <p className="text-sm leading-relaxed text-(--brand-ink-muted)">
          {message}
        </p>
        <Button
          asChild
          className="bg-(--brand-moss) hover:bg-(--brand-moss)/90"
        >
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    </main>
  );
}
