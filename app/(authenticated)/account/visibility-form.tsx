"use client";

import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

export function VisibilityForm({
  initialVisibility,
}: {
  initialVisibility: "PUBLIC" | "PRIVATE";
}) {
  const utils = trpc.useUtils();
  const [isPublic, setIsPublic] = useState(initialVisibility === "PUBLIC");

  const updateVisibility = trpc.users.updateProfileVisibility.useMutation({
    onSuccess: async () => {
      toast.success("プライバシー設定を更新しました");
      await utils.users.me.invalidate();
    },
    onError: (error) => {
      setIsPublic((prev) => !prev);
      toast.error(error.message);
    },
  });

  const handleToggle = (checked: boolean) => {
    setIsPublic(checked);
    updateVisibility.mutate({
      visibility: checked ? "PUBLIC" : "PRIVATE",
    });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-(--brand-ink)">
          統計情報を公開する
        </span>
        <span className="text-xs text-(--brand-ink-muted)">
          オフにすると、他のユーザーからあなたの活動記録・対戦成績が非表示になります
        </span>
      </div>
      <Switch
        checked={isPublic}
        onCheckedChange={handleToggle}
        disabled={updateVisibility.isPending}
        aria-label="統計情報の公開設定"
      />
    </div>
  );
}
