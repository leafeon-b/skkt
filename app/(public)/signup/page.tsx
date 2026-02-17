import Link from "next/link";
import LoginButton from "@/app/components/login-button";
import { sanitizeCallbackUrl } from "@/lib/url";
import SignupForm from "@/app/components/signup-form";

type SignupPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { callbackUrl: rawCallbackUrl } = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl);
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-36 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-gold)_0,transparent_70%)] blur-3xl motion-safe:animate-[glow_11s_ease-in-out_infinite]" />
        <div className="absolute -bottom-48 right-6 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-sky)_0,transparent_68%)] blur-3xl motion-safe:animate-[glow_13s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-size-[32px_32px]" />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-10 px-6 pb-20 pt-16 sm:pt-24">
        <section className="rounded-3xl border border-border/60 bg-white/85 p-8 shadow-sm">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--brand-ink-muted)">
              Sign Up
            </p>
            <h1 className="text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
              新しいアカウントを作成
            </h1>
            <p className="text-sm leading-relaxed text-(--brand-ink-muted)">
              メールとパスワードでデモ用アカウントを作成できます。
            </p>
          </div>
          <div className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-white/90 p-6">
            <SignupForm callbackUrl={callbackUrl} />
            <div className="flex items-center gap-3 text-xs text-(--brand-ink-muted)">
              <span className="h-px flex-1 bg-border/80" />
              もしくは
              <span className="h-px flex-1 bg-border/80" />
            </div>
            <LoginButton
              className="w-full bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
              label="Googleで登録/ログイン"
              callbackUrl={callbackUrl}
            />
            <Link
              href={
                callbackUrl
                  ? `/?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/"
              }
              className="block text-center text-xs font-semibold text-(--brand-ink-muted) hover:text-(--brand-ink)"
            >
              既にアカウントを持っている場合はログインへ戻る
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
