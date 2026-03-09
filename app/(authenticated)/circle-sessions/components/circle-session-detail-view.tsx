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
import type {
  CircleSessionDetailViewModel,
  CircleSessionRoleKey,
} from "@/server/presentation/view-models/circle-session-detail";
import { AddSessionMemberDialog } from "@/app/(authenticated)/circle-sessions/components/add-session-member-dialog";
import { CircleSessionEditDialog } from "@/app/(authenticated)/circle-sessions/components/circle-session-edit-dialog";
import { CircleSessionWithdrawButton } from "@/app/(authenticated)/circle-sessions/components/circle-session-withdraw-button";
import { RemoveSessionMemberButton } from "@/app/(authenticated)/circle-sessions/components/remove-session-member-button";
import { SessionMemberRoleDropdown } from "@/app/(authenticated)/circle-sessions/components/session-member-role-dropdown";
import { TransferSessionOwnershipDialog } from "@/app/(authenticated)/circle-sessions/components/transfer-session-ownership-dialog";
import { Copy, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { RoundRobinScheduleSection } from "./round-robin-schedule-section";
import { MatchDeleteDialog } from "./match-delete-dialog";
import { MatchDialog } from "./match-dialog";
import { MatchMatrixTable } from "./match-matrix-table";
import {
  convertRowOutcomeToApiOutcome,
  getOutcomeLabel,
  getPairMatches,
  getRowOutcomeValue,
  getTodayInputValue,
  type ActiveDialog,
  type DialogMode,
  type RowOutcome,
} from "./match-utils";

export type CircleSessionDetailViewProps = {
  detail: CircleSessionDetailViewModel;
};

const roleLabels: Record<CircleSessionRoleKey, string> = {
  owner: "オーナー",
  manager: "マネージャー",
  member: "メンバー",
};

const roleClasses: Record<CircleSessionRoleKey, string> = {
  owner: "bg-(--brand-gold)/25 text-(--brand-ink)",
  manager: "bg-(--brand-sky)/25 text-(--brand-ink)",
  member: "bg-(--brand-moss)/20 text-(--brand-ink)",
};

export function CircleSessionDetailView({
  detail,
}: CircleSessionDetailViewProps) {
  const memberships = detail.memberships;
  const matches = detail.matches;
  const todayInputValue = getTodayInputValue();
  const getMemberName = (id: string) => {
    const membershipsById = Object.fromEntries(
      memberships.map((membership) => [membership.id, membership]),
    ) as Record<string, (typeof memberships)[number]>;
    return membershipsById[id]?.name ?? "不明";
  };

  const router = useRouter();
  const canDuplicate = detail.canCreateCircleSession;

  const handleDuplicate = () => {
    const params = new URLSearchParams();
    params.set("title", detail.title);
    params.set("startsAt", detail.startsAtInput);
    params.set("endsAt", detail.endsAtInput);
    if (detail.locationLabel) {
      params.set("location", detail.locationLabel);
    }
    if (detail.memoText) {
      params.set("note", detail.memoText);
    }
    router.push(
      `/circles/${encodeURIComponent(detail.circleId)}/sessions/new?${params.toString()}`,
    );
  };

  const [showDeleteSessionDialog, setShowDeleteSessionDialog] = useState(false);
  const deleteSession = trpc.circleSessions.delete.useMutation({
    onSuccess: () => {
      router.push(`/circles/${encodeURIComponent(detail.circleId)}`);
    },
    onError: () => {
      setShowDeleteSessionDialog(false);
      toast.error("削除に失敗しました", {
        description: "時間をおいて再度お試しください",
      });
    },
  });

  const handleDeleteSession = () => {
    deleteSession.mutate({ circleSessionId: detail.circleSessionId });
  };

  const createMatch = trpc.matches.create.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      setActiveDialog(null);
      toast.error("対局結果の追加に失敗しました", {
        description: "時間をおいて再度お試しください",
      });
    },
  });

  const updateMatch = trpc.matches.update.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      setActiveDialog(null);
      toast.error("対局結果の更新に失敗しました", {
        description: "時間をおいて再度お試しください",
      });
    },
  });

  const deleteMatch = trpc.matches.delete.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      setActiveDialog(null);
      toast.error("対局結果の削除に失敗しました", {
        description: "時間をおいて再度お試しください",
      });
    },
  });

  const roleBadgeClassName = detail.viewerRole
    ? (roleClasses[detail.viewerRole] ??
      "bg-(--brand-ink)/10 text-(--brand-ink)")
    : "bg-(--brand-ink)/10 text-(--brand-ink)";
  const memoText = detail.memoText?.trim() ? detail.memoText : "未設定";

  const triggerCellIdRef = useRef<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(
    null,
  );
  const [selectedOutcome, setSelectedOutcome] = useState<RowOutcome>("ROW_WIN");
  const [selectedDate, setSelectedDate] = useState<string>(todayInputValue);

  const applyMatchSelection = (
    rowId: string,
    entry?: {
      match: (typeof matches)[number];
      index: number;
    },
  ) => {
    if (!entry) {
      setSelectedMatchIndex(null);
      setSelectedOutcome("ROW_WIN");
      setSelectedDate(todayInputValue);
      return;
    }

    setSelectedMatchIndex(entry.index);
    setSelectedOutcome(getRowOutcomeValue(rowId, entry.match));
    setSelectedDate(entry.match.createdAtInput);
  };

  const initializeDialogState = (
    mode: DialogMode,
    rowId: string,
    columnId: string,
  ) => {
    if (mode === "add") {
      setSelectedMatchIndex(null);
      setSelectedOutcome("ROW_WIN");
      setSelectedDate(todayInputValue);
      return;
    }

    const pairMatches = getPairMatches(matches, rowId, columnId);
    applyMatchSelection(rowId, pairMatches[0]);
  };

  const openDialog = (mode: DialogMode, rowId: string, columnId: string) => {
    triggerCellIdRef.current = `${rowId}-${columnId}`;
    initializeDialogState(mode, rowId, columnId);
    setActiveDialog({ mode, rowId, columnId });
  };

  const closeDialog = () => setActiveDialog(null);

  const handleCloseAutoFocus = (event: Event) => {
    if (triggerCellIdRef.current) {
      event.preventDefault();
      const el = document.querySelector<HTMLElement>(
        `[data-cell-id="${triggerCellIdRef.current}"]`,
      );
      el?.focus();
      triggerCellIdRef.current = null;
    }
  };

  const handleMatchSelectChange = (nextIndex: number) => {
    if (!activeDialog) {
      return;
    }
    const pairMatches = getPairMatches(
      matches,
      activeDialog.rowId,
      activeDialog.columnId,
    );
    const selected = pairMatches.find((entry) => entry.index === nextIndex);
    applyMatchSelection(activeDialog.rowId, selected);
  };

  const handleDialogSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeDialog) {
      return;
    }

    const player1Id = activeDialog.rowId;
    const player2Id = activeDialog.columnId;
    const outcome = convertRowOutcomeToApiOutcome(
      selectedOutcome,
      activeDialog.rowId,
      player1Id,
    );

    if (activeDialog.mode === "add") {
      createMatch.mutate(
        {
          circleSessionId: detail.circleSessionId,
          player1Id,
          player2Id,
          outcome,
        },
        {
          onSuccess: () => {
            const rowName = getMemberName(activeDialog.rowId);
            const columnName = getMemberName(activeDialog.columnId);
            const outcomeLabel = getOutcomeLabel(
              selectedOutcome,
              rowName,
              columnName,
            );
            toast.success(
              `追加しました: ${rowName} vs ${columnName} / ${outcomeLabel}`,
            );
            setActiveDialog(null);
          },
        },
      );
    } else if (activeDialog.mode === "edit") {
      const pairMatches = getPairMatches(
        matches,
        activeDialog.rowId,
        activeDialog.columnId,
      );
      const selected =
        selectedMatchIndex === null
          ? pairMatches[0]
          : (pairMatches.find((entry) => entry.index === selectedMatchIndex) ??
            pairMatches[0]);
      if (!selected) return;

      updateMatch.mutate(
        {
          matchId: selected.match.id,
          outcome,
        },
        {
          onSuccess: () => {
            const rowName = getMemberName(activeDialog.rowId);
            const columnName = getMemberName(activeDialog.columnId);
            const outcomeLabel = getOutcomeLabel(
              selectedOutcome,
              rowName,
              columnName,
            );
            toast.success(
              `保存しました: ${rowName} vs ${columnName} / ${outcomeLabel}`,
            );
            setActiveDialog(null);
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!activeDialog) {
      return;
    }
    const pairMatches = getPairMatches(
      matches,
      activeDialog.rowId,
      activeDialog.columnId,
    );
    const selected =
      selectedMatchIndex === null
        ? pairMatches[0]
        : (pairMatches.find((entry) => entry.index === selectedMatchIndex) ??
          pairMatches[0]);
    if (!selected) return;

    deleteMatch.mutate(
      { matchId: selected.match.id },
      {
        onSuccess: () => {
          const rowName = getMemberName(activeDialog.rowId);
          const columnName = getMemberName(activeDialog.columnId);
          const outcomeLabel = getOutcomeLabel(
            getRowOutcomeValue(activeDialog.rowId, selected.match),
            rowName,
            columnName,
          );
          toast.success(
            `削除しました: ${rowName} vs ${columnName} / ${outcomeLabel}`,
          );
          setActiveDialog(null);
        },
      },
    );
  };

  const activePairMatches = activeDialog
    ? getPairMatches(matches, activeDialog.rowId, activeDialog.columnId)
    : [];
  const dialogRowName = activeDialog ? getMemberName(activeDialog.rowId) : "";
  const dialogColumnName = activeDialog
    ? getMemberName(activeDialog.columnId)
    : "";
  const dialogTitle = activeDialog
    ? activeDialog.mode === "add"
      ? "対局結果を追加"
      : activeDialog.mode === "edit"
        ? "対局結果を編集"
        : "対局結果を削除"
    : "";
  const outcomeOptions: Array<{ value: RowOutcome; label: string }> =
    activeDialog
      ? [
          {
            value: "ROW_WIN",
            label: getOutcomeLabel("ROW_WIN", dialogRowName, dialogColumnName),
          },
          {
            value: "ROW_LOSS",
            label: getOutcomeLabel("ROW_LOSS", dialogRowName, dialogColumnName),
          },
          {
            value: "DRAW",
            label: getOutcomeLabel("DRAW", dialogRowName, dialogColumnName),
          },
        ]
      : [];
  const selectedMatch =
    activeDialog && activePairMatches.length > 0
      ? (activePairMatches.find(
          (entry) => entry.index === selectedMatchIndex,
        ) ?? activePairMatches[0])
      : null;

  const roleLabel = detail.viewerRole ? roleLabels[detail.viewerRole] : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-60 flex-1">
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
                {detail.title}
              </h1>
              {roleLabel ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${roleBadgeClassName}`}
                >
                  {roleLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-(--brand-ink-muted)">
              {detail.dateTimeLabel}
              {detail.locationLabel ? ` / ${detail.locationLabel}` : ""}
            </p>
            <p className="mt-3 text-xs text-(--brand-ink-muted)">
              連絡メモ: {memoText}
            </p>
          </div>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:min-w-60 sm:max-w-[320px]">
            <div className="flex flex-col gap-3">
              {detail.canEditCircleSession ? (
                <CircleSessionEditDialog
                  circleSessionId={detail.circleSessionId}
                  title={detail.title}
                  startsAtInput={detail.startsAtInput}
                  endsAtInput={detail.endsAtInput}
                  locationLabel={detail.locationLabel}
                  memoText={detail.memoText}
                />
              ) : null}
              {canDuplicate ? (
                <Button
                  variant="outline"
                  className="w-full border-(--brand-ink)/20 bg-white/80 text-(--brand-ink) hover:bg-white"
                  onClick={handleDuplicate}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  セッションの複製
                </Button>
              ) : null}
              {detail.canDeleteCircleSession ? (
                <AlertDialog
                  open={showDeleteSessionDialog}
                  onOpenChange={(open) => {
                    if (!deleteSession.isPending)
                      setShowDeleteSessionDialog(open);
                  }}
                >
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowDeleteSessionDialog(true)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    削除
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>削除</AlertDialogTitle>
                      <AlertDialogDescription>
                        削除すると、参加者情報や対局結果もすべて削除されます。この操作は取り消せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="rounded-xl border border-border/60 bg-(--brand-ink)/5 px-3 py-2 text-sm font-semibold text-(--brand-ink)">
                      {detail.title}
                      <span className="ml-2 text-xs font-normal text-(--brand-ink-muted)">
                        {detail.dateTimeLabel}
                      </span>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteSession.isPending}>
                        キャンセル
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteSession();
                        }}
                        disabled={deleteSession.isPending}
                      >
                        {deleteSession.isPending ? "削除中…" : "削除する"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
              {detail.canWithdrawFromCircleSession &&
              detail.viewerRole &&
              detail.viewerRole !== "owner" ? (
                <CircleSessionWithdrawButton
                  circleSessionId={detail.circleSessionId}
                  circleId={detail.circleId}
                  sessionTitle={detail.title}
                />
              ) : null}
              {detail.canTransferOwnership && detail.viewerUserId ? (
                <TransferSessionOwnershipDialog
                  circleSessionId={detail.circleSessionId}
                  viewerUserId={detail.viewerUserId}
                  memberships={detail.memberships}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <MatchMatrixTable
        memberships={memberships}
        matches={matches}
        openDialog={openDialog}
      />

      <RoundRobinScheduleSection
        circleSessionId={detail.circleSessionId}
        canManage={detail.canManageRoundRobinSchedule}
        schedule={detail.roundRobinSchedule}
      />

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-(--brand-ink)">
            参加メンバー
          </p>
          {detail.canAddCircleSessionMember ? (
            <AddSessionMemberDialog
              circleSessionId={detail.circleSessionId}
              candidates={detail.addableMemberCandidates}
              disabled={detail.addableMemberCandidates.length === 0}
            />
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          {memberships.length === 0 ? (
            <p className="text-xs text-(--brand-ink-muted)">
              まだ参加メンバーがいません
            </p>
          ) : (
            memberships.map((membership) => {
              const memberRoleLabel = membership.role
                ? (roleLabels[membership.role] ?? "メンバー")
                : null;
              return (
                <div key={membership.id} className="flex items-center gap-1">
                  <div className="flex flex-1 items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4">
                    <p className="text-sm font-semibold text-(--brand-ink)">
                      {membership.name}
                    </p>
                    {membership.role && memberRoleLabel ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          roleClasses[membership.role] ??
                          "bg-(--brand-ink)/10 text-(--brand-ink)"
                        }`}
                      >
                        {memberRoleLabel}
                      </span>
                    ) : null}
                  </div>
                  {membership.canChangeRole && membership.role ? (
                    <SessionMemberRoleDropdown
                      circleSessionId={detail.circleSessionId}
                      userId={membership.id}
                      currentRole={membership.role}
                    />
                  ) : null}
                  {membership.canRemoveMember ? (
                    <RemoveSessionMemberButton
                      circleSessionId={detail.circleSessionId}
                      userId={membership.id}
                      memberName={membership.name}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      <MatchDeleteDialog
        activeDialog={activeDialog}
        dialogRowName={dialogRowName}
        dialogColumnName={dialogColumnName}
        activePairMatches={activePairMatches}
        selectedMatch={selectedMatch}
        deleteMatchIsPending={deleteMatch.isPending}
        handleMatchSelectChange={handleMatchSelectChange}
        handleDelete={handleDelete}
        closeDialog={closeDialog}
        handleCloseAutoFocus={handleCloseAutoFocus}
      />

      <MatchDialog
        activeDialog={activeDialog}
        dialogTitle={dialogTitle}
        dialogRowName={dialogRowName}
        dialogColumnName={dialogColumnName}
        activePairMatches={activePairMatches}
        selectedMatch={selectedMatch}
        selectedOutcome={selectedOutcome}
        selectedDate={selectedDate}
        outcomeOptions={outcomeOptions}
        createMatchIsPending={createMatch.isPending}
        updateMatchIsPending={updateMatch.isPending}
        onRequestDelete={
          activeDialog?.mode === "edit"
            ? () =>
                setActiveDialog((prev) =>
                  prev ? { ...prev, mode: "delete" } : null,
                )
            : undefined
        }
        handleMatchSelectChange={handleMatchSelectChange}
        handleDialogSubmit={handleDialogSubmit}
        setSelectedOutcome={setSelectedOutcome}
        setSelectedDate={setSelectedDate}
        closeDialog={closeDialog}
        handleCloseAutoFocus={handleCloseAutoFocus}
      />
    </div>
  );
}
