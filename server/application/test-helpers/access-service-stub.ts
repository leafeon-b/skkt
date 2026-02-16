import { vi } from "vitest";
import type { createAccessService } from "@/server/application/authz/access-service";

type AccessService = ReturnType<typeof createAccessService>;

export const createAccessServiceStub = (): AccessService => {
  const notConfigured = (name: keyof AccessService) =>
    vi.fn(async () => {
      throw new Error(`AccessService stub not configured: ${name}`);
    });

  const accessService = {
    canCreateCircle: notConfigured("canCreateCircle"),
    canListOwnCircles: notConfigured("canListOwnCircles"),
    canViewUser: notConfigured("canViewUser"),
    canViewCircle: notConfigured("canViewCircle"),
    canWithdrawFromCircle: notConfigured("canWithdrawFromCircle"),
    canEditCircle: notConfigured("canEditCircle"),
    canDeleteCircle: notConfigured("canDeleteCircle"),
    canAddCircleMember: notConfigured("canAddCircleMember"),
    canRemoveCircleMember: notConfigured("canRemoveCircleMember"),
    canChangeCircleMemberRole: notConfigured("canChangeCircleMemberRole"),
    canTransferCircleOwnership: notConfigured("canTransferCircleOwnership"),
    canCreateCircleSession: notConfigured("canCreateCircleSession"),
    canViewCircleSession: notConfigured("canViewCircleSession"),
    canWithdrawFromCircleSession: notConfigured("canWithdrawFromCircleSession"),
    canEditCircleSession: notConfigured("canEditCircleSession"),
    canDeleteCircleSession: notConfigured("canDeleteCircleSession"),
    canAddCircleSessionMember: notConfigured("canAddCircleSessionMember"),
    canRemoveCircleSessionMember: notConfigured("canRemoveCircleSessionMember"),
    canChangeCircleSessionMemberRole: notConfigured(
      "canChangeCircleSessionMemberRole",
    ),
    canTransferCircleSessionOwnership: notConfigured(
      "canTransferCircleSessionOwnership",
    ),
    canRecordMatch: notConfigured("canRecordMatch"),
    canViewMatch: notConfigured("canViewMatch"),
    canEditMatch: notConfigured("canEditMatch"),
    canDeleteMatch: notConfigured("canDeleteMatch"),
    canViewMatchHistory: notConfigured("canViewMatchHistory"),
  } satisfies AccessService;

  return accessService;
};
