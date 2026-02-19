"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileFormInner({
  initialName,
  initialEmail,
  hasPassword,
}: {
  initialName: string;
  initialEmail: string;
  hasPassword: boolean;
}) {
  const { update: updateSession } = useSession();
  const utils = trpc.useUtils();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("プロフィールを更新しました");
      await updateSession();
      await utils.users.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (updateProfile.isPending) return;
    updateProfile.mutate({
      name: name.trim() || null,
      email: email.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-name"
          className="text-xs font-semibold text-(--brand-ink-muted)"
        >
          名前
        </label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="名前"
          className="bg-white"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-email"
          className="text-xs font-semibold text-(--brand-ink-muted)"
        >
          メールアドレス
        </label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          className="bg-white"
          disabled={!hasPassword}
          aria-describedby={!hasPassword ? "profile-email-desc" : undefined}
        />
        {!hasPassword && (
          <p id="profile-email-desc" className="text-xs text-(--brand-ink-muted)">
            メールアドレスはOAuth連携先で管理されています
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="self-start bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? "保存中..." : "保存"}
      </Button>
    </form>
  );
}
