"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { AddableMemberCandidate } from "@/server/presentation/view-models/circle-session-detail";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

type AddSessionMemberDialogProps = {
  circleSessionId: string;
  candidates: AddableMemberCandidate[];
};

type RoleValue = "CircleSessionManager" | "CircleSessionMember";

export function AddSessionMemberDialog({
  circleSessionId,
  candidates,
}: AddSessionMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRole, setSelectedRole] = useState<RoleValue>(
    "CircleSessionMember",
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const addMember = trpc.circleSessions.memberships.add.useMutation();

  const canSubmit = selectedUserIds.size > 0 && !isPending;

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsPending(true);
    setError(null);

    try {
      for (const userId of selectedUserIds) {
        await addMember.mutateAsync({
          circleSessionId,
          userId,
          role: selectedRole,
        });
      }
      setOpen(false);
      router.refresh();
      toast.success(
        selectedUserIds.size === 1
          ? "メンバーを追加しました"
          : `${selectedUserIds.size}人のメンバーを追加しました`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedUserIds(new Set());
      setSelectedRole("CircleSessionMember");
      setError(null);
      addMember.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-(--brand-moss) transition hover:bg-(--brand-moss)/10"
        >
          <UserPlus className="size-3.5" aria-hidden="true" />
          追加
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-(--brand-ink)">
            参加メンバーを追加
          </DialogTitle>
          <DialogDescription className="sr-only">
            セッションに参加するメンバーを追加します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']">
              メンバー
            </legend>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-white shadow-xs">
              {candidates.map((candidate) => {
                const checkboxId = `add-member-${candidate.id}`;
                return (
                  <label
                    key={candidate.id}
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-(--brand-ink) transition hover:bg-(--brand-moss)/5"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selectedUserIds.has(candidate.id)}
                      onCheckedChange={() => toggleUser(candidate.id)}
                    />
                    {candidate.name}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="add-member-role"
              className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
            >
              ロール
            </label>
            <select
              id="add-member-role"
              className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-(--brand-ink) shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleValue)}
              aria-required="true"
            >
              <option value="CircleSessionManager">マネージャー</option>
              <option value="CircleSessionMember">メンバー</option>
            </select>
          </div>

          {error ? (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          ) : null}

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
              type="submit"
              className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
              disabled={!canSubmit}
            >
              {isPending
                ? "追加中..."
                : selectedUserIds.size > 0
                  ? `${selectedUserIds.size}人を追加`
                  : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
