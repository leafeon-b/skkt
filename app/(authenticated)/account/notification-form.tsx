"use client";

import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

export function NotificationForm({
  initialEmailEnabled,
}: {
  initialEmailEnabled: boolean;
}) {
  const utils = trpc.useUtils();
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);

  const updatePreference = trpc.notificationPreferences.update.useMutation({
    onSuccess: async () => {
      toast.success("通知設定を更新しました");
      await utils.notificationPreferences.get.invalidate();
    },
    onError: (error) => {
      setEmailEnabled((prev) => !prev);
      toast.error(error.message);
    },
  });

  const handleToggle = (checked: boolean) => {
    setEmailEnabled(checked);
    updatePreference.mutate({ emailEnabled: checked });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-(--brand-ink)">
          メール通知を受け取る
        </span>
        <span className="text-xs text-(--brand-ink-muted)">
          オフにすると、セッション案内などのメール通知が届かなくなります
        </span>
      </div>
      <Switch
        checked={emailEnabled}
        onCheckedChange={handleToggle}
        disabled={updatePreference.isPending}
        aria-label="メール通知の設定"
      />
    </div>
  );
}
