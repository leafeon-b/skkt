import { CircleDeleteButton } from "@/app/(authenticated)/circles/components/circle-delete-button";
import { CircleNotificationToggle } from "@/app/(authenticated)/circles/components/circle-notification-toggle";
import { TransferCircleOwnershipDialog } from "@/app/(authenticated)/circles/components/transfer-circle-ownership-dialog";
import type { CircleSettingsViewModel } from "@/server/presentation/view-models/circle-settings";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export type CircleSettingsViewProps = {
  settings: CircleSettingsViewModel;
  backHref: string;
};

export function CircleSettingsView({
  settings,
  backHref,
}: CircleSettingsViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-(--brand-ink-muted) hover:text-(--brand-ink)"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          研究会に戻る
        </Link>
        <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
          設定
        </h1>
        <p className="mt-1 text-sm text-(--brand-ink-muted)">
          {settings.circleName}
        </p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-(--brand-ink)">
          通知設定
        </p>
        <CircleNotificationToggle
          circleId={settings.circleId}
          initialEnabled={settings.sessionEmailNotificationEnabled}
        />
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-(--brand-ink)">
          オーナー移譲
        </p>
        <p className="mb-4 text-xs text-(--brand-ink-muted)">
          研究会のオーナー権限を他のメンバーに移譲します。移譲後、あなたのロールはマネージャーに変更されます。
        </p>
        <TransferCircleOwnershipDialog
          circleId={settings.circleId}
          viewerUserId={settings.viewerUserId}
          members={settings.members}
        />
      </section>

      <section className="rounded-2xl border border-red-200 bg-white/90 p-6 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-red-700">危険な操作</p>
        <p className="mb-4 text-xs text-(--brand-ink-muted)">
          研究会を削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
        </p>
        <CircleDeleteButton
          circleId={settings.circleId}
          circleName={settings.circleName}
        />
      </section>
    </div>
  );
}
