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
import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);

  const deleteAccount = trpc.users.deleteAccount.useMutation({
    onSuccess: () => {
      signOut({ callbackUrl: "/" });
    },
    onError: (error) => {
      setOpen(false);
      toast.error("アカウントの削除に失敗しました", {
        description: error.message,
      });
    },
  });

  const handleDelete = () => {
    deleteAccount.mutate();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!deleteAccount.isPending) {
          setOpen(v);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          アカウントを削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>アカウントを削除</AlertDialogTitle>
          <AlertDialogDescription>
            アカウントを削除すると、プロフィール情報や研究会の参加情報が削除されます。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAccount.isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleteAccount.isPending}
          >
            {deleteAccount.isPending ? "削除中…" : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
