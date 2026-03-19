import { DeleteAccountSection } from "@/app/(authenticated)/account/delete-account-section";
import { NotificationForm } from "@/app/(authenticated)/account/notification-form";
import { PasswordForm } from "@/app/(authenticated)/account/password-form";
import { ProfileFormInner } from "@/app/(authenticated)/account/profile-form";
import { VisibilityForm } from "@/app/(authenticated)/account/visibility-form";
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
          initialImage={viewModel.image}
          hasPassword={viewModel.hasPassword}
        />
      </section>

      <section
        aria-labelledby="section-privacy"
        className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm"
      >
        <h2
          id="section-privacy"
          className="mb-4 text-lg font-semibold text-(--brand-ink)"
        >
          プライバシー
        </h2>
        <VisibilityForm initialVisibility={viewModel.profileVisibility} />
      </section>

      <section
        aria-labelledby="section-notification"
        className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm"
      >
        <h2
          id="section-notification"
          className="mb-4 text-lg font-semibold text-(--brand-ink)"
        >
          通知
        </h2>
        <NotificationForm initialEmailEnabled={viewModel.emailEnabled} />
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

      <section
        aria-labelledby="section-delete-account"
        className="rounded-2xl border border-destructive/30 bg-white/85 p-6 shadow-sm"
      >
        <h2
          id="section-delete-account"
          className="mb-2 text-lg font-semibold text-destructive"
        >
          アカウント削除
        </h2>
        <p className="mb-4 text-sm text-(--brand-ink-muted)">
          アカウントを削除すると、プロフィール情報や研究会の参加情報が削除されます。この操作は取り消せません。
        </p>
        <DeleteAccountSection />
      </section>
    </div>
  );
}
