"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import type { CircleMembershipRoleUpdateInput } from "@/server/presentation/dto/circle-membership";
import type { CircleRoleKey } from "@/server/presentation/view-models/circle-overview";

type AssignableCircleRole = CircleMembershipRoleUpdateInput["role"];
import { Check, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type MemberRoleDropdownProps = {
  circleId: string;
  userId: string;
  currentRole: CircleRoleKey;
};

const assignableRoles: ReadonlyArray<{
  key: CircleRoleKey;
  label: string;
  apiValue: AssignableCircleRole;
}> = [
  { key: "manager", label: "マネージャー", apiValue: "CircleManager" },
  { key: "member", label: "メンバー", apiValue: "CircleMember" },
];

export function MemberRoleDropdown({
  circleId,
  userId,
  currentRole,
}: MemberRoleDropdownProps) {
  const router = useRouter();

  const updateRole = trpc.circles.memberships.updateRole.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      toast.error("ロールの変更に失敗しました", {
        description: "時間をおいて再度お試しください",
      });
    },
  });

  const handleRoleChange = (apiValue: AssignableCircleRole) => {
    updateRole.mutate({ circleId, userId, role: apiValue });
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
