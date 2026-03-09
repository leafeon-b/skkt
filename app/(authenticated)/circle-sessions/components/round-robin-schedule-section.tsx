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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GENERIC_ERROR_MESSAGE } from "@/app/constants/error-messages";
import { trpc } from "@/lib/trpc/client";
import type {
  RoundRobinPairingPlayer,
  RoundRobinScheduleViewModel,
} from "@/server/presentation/view-models/circle-session-detail";
import { Shuffle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function buildMatrix(schedule: RoundRobinScheduleViewModel) {
  const playerMap = new Map<string, RoundRobinPairingPlayer>();
  for (const round of schedule.rounds) {
    for (const pairing of round.pairings) {
      playerMap.set(pairing.player1.id, pairing.player1);
      playerMap.set(pairing.player2.id, pairing.player2);
    }
  }
  const players = [...playerMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "ja"),
  );

  const pairToRound = new Map<string, number>();
  for (const round of schedule.rounds) {
    for (const pairing of round.pairings) {
      const key1 = `${pairing.player1.id}:${pairing.player2.id}`;
      const key2 = `${pairing.player2.id}:${pairing.player1.id}`;
      pairToRound.set(key1, round.roundNumber);
      pairToRound.set(key2, round.roundNumber);
    }
  }

  return { players, pairToRound };
}

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
      toast.error(GENERIC_ERROR_MESSAGE, {
        description: "時間をおいて再度お試しください",
      });
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
      toast.error(GENERIC_ERROR_MESSAGE, {
        description: "時間をおいて再度お試しください",
      });
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
        schedule.rounds.length > 0 ? (
          <ScheduleMatrix schedule={schedule} />
        ) : (
          <p className="mt-4 text-xs text-(--brand-ink-muted)">
            スケジュールにラウンドがありません
          </p>
        )
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

function ScheduleMatrix({
  schedule,
}: {
  schedule: RoundRobinScheduleViewModel;
}) {
  const { players, pairToRound } = useMemo(
    () => buildMatrix(schedule),
    [schedule],
  );

  return (
    <div className="mt-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-semibold text-(--brand-ink)" />
            {players.map((p) => (
              <TableHead
                key={p.id}
                className="text-center text-xs font-semibold text-(--brand-ink)"
              >
                {p.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((rowPlayer) => (
            <TableRow key={rowPlayer.id}>
              <TableCell className="text-xs font-semibold text-(--brand-ink)">
                {rowPlayer.name}
              </TableCell>
              {players.map((colPlayer) => {
                if (rowPlayer.id === colPlayer.id) {
                  return (
                    <TableCell
                      key={colPlayer.id}
                      className="text-center text-xs text-(--brand-ink-muted)"
                    >
                      -
                    </TableCell>
                  );
                }
                const roundNumber = pairToRound.get(
                  `${rowPlayer.id}:${colPlayer.id}`,
                );
                return (
                  <TableCell
                    key={colPlayer.id}
                    className="text-center text-sm text-(--brand-ink)"
                  >
                    {roundNumber ?? ""}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
