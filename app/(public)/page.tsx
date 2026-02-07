import CredentialsLoginForm from "@/app/components/credentials-login-form";
import Link from "next/link";
import LoginButton from "@/app/components/login-button";

const valueProps = [
  {
    title: "研究会の記録を簡単に管理",
    description:
      "日程、参加者、対局メモをひとつの画面で整理し、記録の迷子を防ぎます。",
  },
  {
    title: "メンバー間での情報共有が容易",
    description:
      "更新内容がすぐに共有できるので、開催後の振り返りもスムーズです。",
  },
  {
    title: "直感的なインターフェースで使いやすい",
    description: "必要な情報だけを見せる設計で、初めてでも迷わず操作できます。",
  },
];

export default async function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-36 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-gold)_0,transparent_70%)] blur-3xl motion-safe:animate-[glow_11s_ease-in-out_infinite]" />
        <div className="absolute -bottom-48 right-6 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-sky)_0,transparent_68%)] blur-3xl motion-safe:animate-[glow_13s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-size-[32px_32px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-16 sm:pt-24">
        <section className="rounded-3xl border border-border/60 bg-white/85 p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-5">
              <h1 className="text-4xl font-(--font-display) text-(--brand-ink) sm:text-5xl">
                SKKT
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-(--brand-ink-muted) sm:text-lg">
                研究会の記録と共有を、迷わず続けられる場所へ。SKKTは、
                日程管理から振り返りまでをやさしく支える記録サービスです。
              </p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/60 bg-white/90 p-6">
              <LoginButton className="w-full bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90" />
              <div className="flex items-center gap-3 text-xs text-(--brand-ink-muted)">
                <span className="h-px flex-1 bg-border/80" />
                メールでログイン
                <span className="h-px flex-1 bg-border/80" />
              </div>
              <CredentialsLoginForm />
              <Link
                href="/signup"
                className="block text-center text-xs font-semibold text-(--brand-ink-muted) hover:text-(--brand-ink)"
              >
                アカウントを作成する
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-(--font-display) text-(--brand-ink) sm:text-3xl">
              記録が続く理由を、ひと目で
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {valueProps.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-border/60 bg-white/80 p-4 transition hover:border-border hover:bg-white"
              >
                <p className="text-sm font-semibold text-(--brand-ink)">
                  {value.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-(--brand-ink-muted)">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
