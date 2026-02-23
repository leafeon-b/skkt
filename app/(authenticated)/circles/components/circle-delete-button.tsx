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
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CircleDeleteButtonProps = {
  circleId: string;
  circleName: string;
};

export function CircleDeleteButton({
  circleId,
  circleName,
}: CircleDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const deleteCircle = trpc.circles.delete.useMutation({
    onSuccess: () => {
      router.push("/");
    },
    onError: () => {
      setOpen(false);
      toast.error("研究会の削除に失敗しました");
    },
  });

  const handleDelete = () => {
    deleteCircle.mutate({ circleId });
  };

  const isConfirmed = confirmText === circleName;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!deleteCircle.isPending) {
          setOpen(v);
          if (!v) setConfirmText("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full"
          aria-label={`「${circleName}」を削除`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          研究会を削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>研究会を削除</AlertDialogTitle>
          <AlertDialogDescription>
            削除すると、セッション・参加者情報・対局結果もすべて削除されます。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-(--brand-ink)/5 px-3 py-2 text-sm font-semibold text-(--brand-ink)">
            {circleName}
          </div>
          <div>
            <p className="mb-1.5 text-sm text-(--brand-ink-muted)">
              確認のため、研究会名
              <span className="font-semibold text-(--brand-ink)">
                {" "}
                {circleName}{" "}
              </span>
              を入力してください
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={circleName}
              disabled={deleteCircle.isPending}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCircle.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={!isConfirmed || deleteCircle.isPending}
          >
            {deleteCircle.isPending ? "削除中…" : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
