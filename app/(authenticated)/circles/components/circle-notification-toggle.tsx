"use client";

import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc/client";
import { useCallback, useState } from "react";

type CircleNotificationToggleProps = {
  circleId: string;
  initialEnabled: boolean;
};

export function CircleNotificationToggle({
  circleId,
  initialEnabled,
}: CircleNotificationToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);

  const mutation =
    trpc.circles.updateSessionEmailNotification.useMutation();

  const handleChange = useCallback(
    (checked: boolean) => {
      const previous = enabled;
      setEnabled(checked);
      mutation.mutate(
        { circleId, enabled: checked },
        {
          onError: () => {
            setEnabled(previous);
          },
        },
      );
    },
    [circleId, enabled, mutation],
  );

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-(--brand-ink)">
          セッション作成時のメール通知
        </span>
        <span className="text-xs text-(--brand-ink-muted)">
          新しいセッションが作成されたとき、メンバーにメール通知を送信します
        </span>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleChange}
        disabled={mutation.isPending}
        aria-label="セッション作成時のメール通知"
      />
    </div>
  );
}
