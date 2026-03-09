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
import { trpc } from "@/lib/trpc/client";
import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type RemoveSessionMemberButtonProps = {
  circleSessionId: string;
  userId: string;
  memberName: string;
};

export function RemoveSessionMemberButton({
  circleSessionId,
  userId,
  memberName,
}: RemoveSessionMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const remove = trpc.circleSessions.memberships.remove.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
      toast.success(`${memberName}を除外しました`);
    },
    onError: () => {
      setOpen(false);
      toast.error("除外に失敗しました", {
        description: "時間をおいて再度お試しください",
      });
    },
  });

  const handleRemove = () => {
    remove.mutate({ circleSessionId, userId });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!remove.isPending) setOpen(v);
      }}
    >
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-(--brand-ink-muted) transition hover:bg-red-50 hover:text-red-700"
          aria-label={`${memberName}を除外`}
        >
          <UserMinus className="size-3.5" aria-hidden="true" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>セッションから除外</AlertDialogTitle>
          <AlertDialogDescription>
            {memberName}をこのセッションから除外しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            disabled={remove.isPending}
          >
            {remove.isPending ? "除外中…" : "除外する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
