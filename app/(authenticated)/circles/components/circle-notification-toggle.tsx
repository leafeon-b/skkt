"use client";

import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export function CircleNotificationToggle() {
  // TODO: バックエンドAPI連携時にローカルステートからtRPC mutationに置き換える
  const [enabled, setEnabled] = useState(true);

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
        onCheckedChange={setEnabled}
        aria-label="セッション作成時のメール通知"
      />
    </div>
  );
}
