"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENERIC_ERROR_MESSAGE } from "@/app/constants/error-messages";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const AVATAR_ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

export function ProfileFormInner({
  initialName,
  initialEmail,
  initialImage,
  hasPassword,
}: {
  initialName: string;
  initialEmail: string;
  initialImage: string | null;
  hasPassword: boolean;
}) {
  const { update: updateSession } = useSession();
  const utils = trpc.useUtils();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("プロフィールを更新しました");
      await updateSession();
      await utils.users.me.invalidate();
    },
    onError: (error) => {
      if (error.data?.isValidationError) {
        toast.error(
          "プロフィールの更新に失敗しました。入力内容を確認してください。",
        );
        return;
      }
      toast.error(GENERIC_ERROR_MESSAGE, {
        description: "時間をおいて再度お試しください",
      });
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > AVATAR_MAX_SIZE) {
      toast.error("画像サイズは2MB以下にしてください");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(
          (data as { message?: string } | null)?.message ??
            "画像のアップロードに失敗しました",
        );
        return;
      }

      toast.success("プロフィール画像を更新しました");
      setSelectedFile(null);
      await updateSession();
      await utils.users.me.invalidate();
    } catch {
      toast.error(GENERIC_ERROR_MESSAGE, {
        description: "時間をおいて再度お試しください",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (updateProfile.isPending) return;
    updateProfile.mutate({
      name: name.trim() || null,
      email: email.trim() || null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-(--brand-moss) focus:ring-offset-2"
          aria-label="プロフィール画像を変更"
        >
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="プロフィール画像"
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-(--brand-moss)/20 text-2xl font-bold text-(--brand-ink)">
              {name.charAt(0) || "?"}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity hover:opacity-100">
            変更
          </div>
        </button>
        <div className="flex flex-col gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPTED}
            onChange={handleFileChange}
            className="hidden"
            aria-label="画像ファイルを選択"
          />
          {selectedFile && (
            <Button
              type="button"
              size="sm"
              onClick={handleAvatarUpload}
              disabled={isUploading}
              className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
            >
              {isUploading ? "アップロード中..." : "画像をアップロード"}
            </Button>
          )}
          <p className="text-xs text-(--brand-ink-muted)">
            JPEG, PNG, WebP, GIF（2MB以下）
          </p>
        </div>
      </div>

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
            <p
              id="profile-email-desc"
              className="text-xs text-(--brand-ink-muted)"
            >
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
    </div>
  );
}
