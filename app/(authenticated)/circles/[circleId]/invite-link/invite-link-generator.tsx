"use client";

import { useState } from "react";
import { Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

type InviteLinkGeneratorProps = {
  circleId: string;
};

export function InviteLinkGenerator({ circleId }: InviteLinkGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const createInviteLink = trpc.circles.inviteLinks.create.useMutation();

  const handleCreate = () => {
    if (createInviteLink.isPending) return;
    createInviteLink.mutate({ circleId });
  };

  const inviteUrl = createInviteLink.data
    ? `${window.location.origin}/invite/${createInviteLink.data.token}`
    : null;

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードへのアクセスが拒否された場合は何もしない
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!createInviteLink.data ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-white/90 p-8 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-(--brand-moss)/10">
            <Link className="size-6 text-(--brand-moss)" />
          </div>
          <div>
            <p className="text-sm font-semibold text-(--brand-ink)">
              招待リンクを作成
            </p>
            <p className="mt-1 text-xs text-(--brand-ink-muted)">
              リンクを共有すると、誰でもこの研究会に参加できます。
              <br />
              有効期限は7日間です。
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={createInviteLink.isPending}
            className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
          >
            <Link className="size-4" />
            {createInviteLink.isPending ? "作成中..." : "招待リンクを作成"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white/90 p-8 shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="size-5 text-green-600" />
            <p className="text-sm font-semibold text-(--brand-ink)">
              招待リンクが作成されました
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-(--brand-paper) p-3">
            <code className="flex-1 truncate text-xs text-(--brand-ink)">
              {inviteUrl}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "コピー済み" : "コピー"}
            </Button>
          </div>
          <p className="text-xs text-(--brand-ink-muted)">
            有効期限:{" "}
            {createInviteLink.data.expiresAt.toLocaleDateString("ja-JP")}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              createInviteLink.reset();
              setCopied(false);
            }}
            className="self-start"
          >
            別のリンクを作成
          </Button>
        </div>
      )}
      {createInviteLink.error ? (
        <p className="text-xs text-red-600" role="alert">
          {createInviteLink.error.message}
        </p>
      ) : null}
    </div>
  );
}
