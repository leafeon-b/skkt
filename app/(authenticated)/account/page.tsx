import { PasswordForm } from "@/app/(authenticated)/account/password-form";
import { ProfileFormInner } from "@/app/(authenticated)/account/profile-form";
import { getAccountViewModel } from "@/server/presentation/providers/account-provider";

export default async function AccountPage() {
  const viewModel = await getAccountViewModel();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-bold text-(--brand-ink)">アカウント設定</h1>

      <section
        aria-labelledby="section-profile"
        className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm"
      >
        <h2
          id="section-profile"
          className="mb-4 text-lg font-semibold text-(--brand-ink)"
        >
          プロフィール
        </h2>
        <ProfileFormInner
          initialName={viewModel.name}
          initialEmail={viewModel.email}
          hasPassword={viewModel.hasPassword}
        />
      </section>

      {viewModel.hasPassword && (
        <section
          aria-labelledby="section-password"
          className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm"
        >
          <h2
            id="section-password"
            className="mb-4 text-lg font-semibold text-(--brand-ink)"
          >
            パスワードの変更
          </h2>
          <PasswordForm />
        </section>
      )}
    </div>
  );
}
