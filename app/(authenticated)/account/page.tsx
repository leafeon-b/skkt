"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

function ProfileFormInner({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
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
        />
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

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      toast.success("パスワードを変更しました");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (changePassword.isPending) return;
    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードが一致しません");
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="current-password"
          className="text-xs font-semibold text-(--brand-ink-muted)"
        >
          現在のパスワード
        </label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="bg-white"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="new-password"
          className="text-xs font-semibold text-(--brand-ink-muted)"
        >
          新しいパスワード（8文字以上）
        </label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          className="bg-white"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirm-password"
          className="text-xs font-semibold text-(--brand-ink-muted)"
        >
          新しいパスワード（確認）
        </label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          className="bg-white"
        />
      </div>
      <Button
        type="submit"
        className="self-start bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
        disabled={changePassword.isPending}
      >
        {changePassword.isPending ? "変更中..." : "パスワードを変更"}
      </Button>
    </form>
  );
}

export default function AccountPage() {
  const meQuery = trpc.users.me.useQuery();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-bold text-(--brand-ink)">アカウント設定</h1>

      <section className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-(--brand-ink)">
          プロフィール
        </h2>
        {meQuery.isLoading ? (
          <p role="status" className="text-sm text-(--brand-ink-muted)">読み込み中...</p>
        ) : meQuery.data ? (
          <ProfileFormInner
            initialName={meQuery.data.name ?? ""}
            initialEmail={meQuery.data.email ?? ""}
          />
        ) : null}
      </section>

      {meQuery.data?.hasPassword && (
        <section className="rounded-2xl border border-border/60 bg-white/85 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-(--brand-ink)">
            パスワードの変更
          </h2>
          <PasswordForm />
        </section>
      )}
    </div>
  );
}
