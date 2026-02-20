"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CircleSessionWithdrawButtonProps = {
  circleSessionId: string;
  circleId: string;
  sessionTitle: string;
};

export function CircleSessionWithdrawButton({
  circleSessionId,
  circleId,
  sessionTitle,
}: CircleSessionWithdrawButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const withdraw = trpc.circleSessions.participations.withdraw.useMutation({
    onSuccess: () => {
      router.push(`/circles/${encodeURIComponent(circleId)}`);
    },
    onError: () => {
      setOpen(false);
      toast.error("退会に失敗しました");
    },
  });

  const handleWithdraw = () => {
    withdraw.mutate({ circleSessionId });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!withdraw.isPending) setOpen(v);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-xs text-red-700 hover:bg-red-50 hover:text-red-800"
          aria-label={`「${sessionTitle}」から退会`}
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          退会
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>セッションから退会</AlertDialogTitle>
          <AlertDialogDescription>
            このセッションから退会します。再度参加するには招待が必要です。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-xl border border-border/60 bg-(--brand-ink)/5 px-3 py-2 text-sm font-semibold text-(--brand-ink)">
          {sessionTitle}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={withdraw.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleWithdraw();
            }}
            disabled={withdraw.isPending}
          >
            {withdraw.isPending ? "退会中…" : "退会する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
