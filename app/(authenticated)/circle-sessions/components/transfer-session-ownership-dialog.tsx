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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import type { CircleSessionMembership } from "@/server/presentation/view-models/circle-session-detail";
import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type TransferSessionOwnershipDialogProps = {
  circleSessionId: string;
  viewerUserId: string;
  memberships: CircleSessionMembership[];
};

export function TransferSessionOwnershipDialog({
  circleSessionId,
  viewerUserId,
  memberships,
}: TransferSessionOwnershipDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const candidates = memberships.filter(
    (m) => m.role !== null && m.role !== "owner",
  );

  const transfer =
    trpc.circleSessions.memberships.transferOwnership.useMutation({
      onSuccess: () => {
        setShowConfirm(false);
        setOpen(false);
        router.refresh();
        toast.success("オーナーを移譲しました");
      },
      onError: () => {
        setShowConfirm(false);
        toast.error("オーナーの移譲に失敗しました");
      },
    });

  const handleTransfer = () => {
    if (!selectedUserId) return;
    transfer.mutate({
      circleSessionId,
      fromUserId: viewerUserId,
      toUserId: selectedUserId,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (transfer.isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedUserId(null);
      setShowConfirm(false);
      transfer.reset();
    }
  };

  const selectedMember = candidates.find((m) => m.id === selectedUserId);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-(--brand-ink)/20 bg-white/80 text-(--brand-ink) hover:bg-white"
          >
            <ArrowRightLeft className="size-4" aria-hidden="true" />
            オーナーを移譲
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md rounded-2xl border-border/60 bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-(--brand-ink)">
              オーナーを移譲
            </DialogTitle>
            <DialogDescription className="text-sm text-(--brand-ink-muted)">
              セッションのオーナー権限を他のメンバーに移譲します。移譲後、あなたのロールはマネージャーに変更されます。
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="transfer-target"
              className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
            >
              移譲先
            </label>
            {candidates.length === 0 ? (
              <p className="text-xs text-(--brand-ink-muted)">
                移譲可能なメンバーがいません
              </p>
            ) : (
              <select
                id="transfer-target"
                className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-(--brand-ink) shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                value={selectedUserId ?? ""}
                onChange={(e) => setSelectedUserId(e.target.value || null)}
                aria-required="true"
              >
                <option value="">選択してください</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-(--brand-ink)/20 bg-white/80 text-(--brand-ink)"
              onClick={() => handleOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
              disabled={!selectedUserId}
              onClick={() => setShowConfirm(true)}
            >
              移譲する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showConfirm}
        onOpenChange={(v) => {
          if (!transfer.isPending) setShowConfirm(v);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>オーナー移譲の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.name}
              にオーナー権限を移譲しますか？あなたのロールはマネージャーに変更されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transfer.isPending}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleTransfer();
              }}
              disabled={transfer.isPending}
            >
              {transfer.isPending ? "移譲中…" : "移譲する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
