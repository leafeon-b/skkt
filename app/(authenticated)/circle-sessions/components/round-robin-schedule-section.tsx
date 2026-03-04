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
import type { RoundRobinScheduleViewModel } from "@/server/presentation/view-models/circle-session-detail";
import { Shuffle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type RoundRobinScheduleSectionProps = {
  circleSessionId: string;
  canManage: boolean;
  schedule: RoundRobinScheduleViewModel | null;
};

export function RoundRobinScheduleSection({
  circleSessionId,
  canManage,
  schedule,
}: RoundRobinScheduleSectionProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const generate = trpc.roundRobinSchedules.generate.useMutation({
    onSuccess: () => {
      router.refresh();
      toast.success("総当たりスケジュールを生成しました");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSchedule = trpc.roundRobinSchedules.delete.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(false);
      router.refresh();
      toast.success("総当たりスケジュールを削除しました");
    },
    onError: (error) => {
      setShowDeleteDialog(false);
      toast.error(error.message);
    },
  });

  const handleGenerate = () => {
    generate.mutate({ circleSessionId });
  };

  const handleDelete = () => {
    deleteSchedule.mutate({ circleSessionId });
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-(--brand-ink)">
          総当たりスケジュール
        </p>
        {canManage && schedule ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteSchedule.isPending}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              削除
            </Button>
          </div>
        ) : null}
      </div>

      {schedule ? (
        <div className="mt-4 space-y-4">
          {schedule.rounds.map((round) => (
            <div key={round.roundNumber}>
              <p className="mb-2 text-xs font-semibold text-(--brand-ink)">
                第{round.roundNumber}ラウンド
              </p>
              <div className="space-y-1.5">
                {round.pairings.map((pairing) => (
                  <div
                    key={`${pairing.player1.id}-${pairing.player2.id}`}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/70 px-3 py-2 text-sm text-(--brand-ink)"
                  >
                    <span className="font-medium">{pairing.player1.name}</span>
                    <span className="text-xs text-(--brand-ink-muted)">vs</span>
                    <span className="font-medium">{pairing.player2.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs text-(--brand-ink-muted)">
            スケジュールが未生成です
          </p>
          {canManage ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleGenerate}
              disabled={generate.isPending}
            >
              <Shuffle className="size-3.5" aria-hidden="true" />
              {generate.isPending ? "生成中…" : "スケジュールを生成"}
            </Button>
          ) : null}
        </div>
      )}

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!deleteSchedule.isPending) setShowDeleteDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>スケジュールを削除</AlertDialogTitle>
            <AlertDialogDescription>
              総当たりスケジュールを削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSchedule.isPending}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteSchedule.isPending}
            >
              {deleteSchedule.isPending ? "削除中…" : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
