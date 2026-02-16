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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CircleWithdrawButtonProps = {
  circleId: string;
  circleName: string;
};

export function CircleWithdrawButton({
  circleId,
  circleName,
}: CircleWithdrawButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const withdraw = trpc.circles.participations.withdraw.useMutation({
    onSuccess: () => {
      router.push("/");
    },
    onError: () => {
      setOpen(false);
      toast.error("脱退に失敗しました");
    },
  });

  const handleWithdraw = () => {
    withdraw.mutate({ circleId });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!withdraw.isPending) setOpen(v);
      }}
    >
      <Button
        variant="ghost"
        className="text-xs text-red-700 hover:bg-red-50 hover:text-red-800"
        onClick={() => setOpen(true)}
        aria-label={`「${circleName}」から脱退`}
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        脱退
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>研究会から脱退</AlertDialogTitle>
          <AlertDialogDescription>
            この研究会から脱退します。再度参加するには招待が必要です。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-xl border border-border/60 bg-(--brand-ink)/5 px-3 py-2 text-sm font-semibold text-(--brand-ink)">
          {circleName}
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
            {withdraw.isPending ? "脱退中…" : "脱退する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
