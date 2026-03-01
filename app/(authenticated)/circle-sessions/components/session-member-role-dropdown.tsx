"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import type { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import type { CircleSessionRoleKey } from "@/server/presentation/view-models/circle-session-detail";
import { Check, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SessionMemberRoleDropdownProps = {
  circleSessionId: string;
  userId: string;
  currentRole: CircleSessionRoleKey;
};

const assignableRoles: ReadonlyArray<{
  key: CircleSessionRoleKey;
  label: string;
  apiValue: CircleSessionRole;
}> = [
  {
    key: "manager",
    label: "マネージャー",
    apiValue: "CircleSessionManager",
  },
  { key: "member", label: "メンバー", apiValue: "CircleSessionMember" },
];

export function SessionMemberRoleDropdown({
  circleSessionId,
  userId,
  currentRole,
}: SessionMemberRoleDropdownProps) {
  const router = useRouter();

  const updateRole = trpc.circleSessions.memberships.updateRole.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      toast.error("ロールの変更に失敗しました");
    },
  });

  const handleRoleChange = (apiValue: CircleSessionRole) => {
    updateRole.mutate({ circleSessionId, userId, role: apiValue });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-(--brand-ink-muted) transition hover:bg-(--brand-ink)/10 hover:text-(--brand-ink)"
          disabled={updateRole.isPending}
          aria-label="ロールを変更"
        >
          {updateRole.isPending ? (
            <span className="text-[10px]">…</span>
          ) : (
            <Pencil className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {assignableRoles.map((role) => (
          <DropdownMenuItem
            key={role.key}
            disabled={currentRole === role.key}
            onClick={() => handleRoleChange(role.apiValue)}
          >
            <span className="flex items-center gap-2">
              {currentRole === role.key ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <span className="size-3.5" />
              )}
              {role.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
