"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function PasswordForm() {
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
