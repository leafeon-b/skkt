"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

type InviteAcceptViewProps = {
  token: string;
  circleName: string;
  expired: boolean;
  isAuthenticated: boolean;
};

export function InviteAcceptView({
  token,
  circleName,
  expired,
  isAuthenticated,
}: InviteAcceptViewProps) {
  const router = useRouter();
  const redeemMutation = trpc.circles.inviteLinks.redeem.useMutation({
    onSuccess: (data) => {
      router.push(`/circles/${data.circleId}`);
    },
  });

  const handleAccept = () => {
    if (redeemMutation.isPending) return;
    redeemMutation.mutate({ token });
  };

  if (expired) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-white/85 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-(--brand-ink)">
          この招待リンクは有効期限が切れています
        </p>
        <p className="text-xs text-(--brand-ink-muted)">
          研究会のメンバーに新しい招待リンクを発行してもらってください。
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-white/85 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-(--brand-ink)">
          「{circleName}」への招待
        </p>
        <p className="text-xs text-(--brand-ink-muted)">
          参加するにはログインまたはアカウント作成が必要です。
        </p>
        <div className="flex gap-3">
          <Button
            asChild
            className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
          >
            <a href={`/?callbackUrl=/invite/${token}`}>ログイン</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/signup?callbackUrl=/invite/${token}`}>アカウント作成</a>
          </Button>
        </div>
      </div>
    );
  }

  if (redeemMutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-white/85 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-(--brand-ink)">
          {redeemMutation.data.alreadyMember
            ? `「${circleName}」に再参加しました`
            : `「${circleName}」に参加しました`}
        </p>
        <p className="text-xs text-(--brand-ink-muted)">リダイレクト中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-white/85 p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-(--brand-ink)">
        「{circleName}」への招待
      </p>
      <p className="text-xs text-(--brand-ink-muted)">
        この研究会に参加しますか？
      </p>
      <Button
        onClick={handleAccept}
        disabled={redeemMutation.isPending}
        className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
      >
        {redeemMutation.isPending ? "参加中..." : "参加する"}
      </Button>
      {redeemMutation.error ? (
        <p className="text-xs text-red-600" role="alert">
          {redeemMutation.error.message}
        </p>
      ) : null}
    </div>
  );
}
