import type { UserId } from "@/server/domain/common/ids";
import { assertDifferentIds } from "@/server/domain/common/validation";
import {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";

export type CircleMember = {
  userId: UserId;
  role: CircleRole;
};

export type CircleSessionMember = {
  userId: UserId;
  role: CircleSessionRole;
};

const assertSingleOwner = (ownerCount: number, label: string): void => {
  if (ownerCount !== 1) {
    throw new Error(`${label} must have exactly one owner`);
  }
};

export const assertSingleCircleOwner = (members: CircleMember[]): void => {
  const owners = members.filter(
    (member) => member.role === CircleRole.CircleOwner,
  );
  assertSingleOwner(owners.length, "Circle");
};

export const assertCanAddCircleMemberWithRole = (
  members: CircleMember[],
  newRole: CircleRole,
): void => {
  const hasOwner = members.some((m) => m.role === CircleRole.CircleOwner);
  if (!hasOwner && newRole !== CircleRole.CircleOwner) {
    throw new Error("Circle must have exactly one owner");
  }
  if (hasOwner && newRole === CircleRole.CircleOwner) {
    throw new Error("Circle must have exactly one owner");
  }
};

export const assertSingleCircleSessionOwner = (
  members: CircleSessionMember[],
): void => {
  const owners = members.filter(
    (member) => member.role === CircleSessionRole.CircleSessionOwner,
  );
  assertSingleOwner(owners.length, "CircleSession");
};

export const assertCanAddParticipantWithRole = (
  participants: CircleSessionMember[],
  newRole: CircleSessionRole,
): void => {
  const hasOwner = participants.some(
    (p) => p.role === CircleSessionRole.CircleSessionOwner,
  );
  if (!hasOwner && newRole !== CircleSessionRole.CircleSessionOwner) {
    throw new Error("CircleSession must have exactly one owner");
  }
  if (hasOwner && newRole === CircleSessionRole.CircleSessionOwner) {
    throw new Error("CircleSession must have exactly one owner");
  }
};

export const transferCircleOwnership = (
  members: CircleMember[],
  fromUserId: UserId,
  toUserId: UserId,
): CircleMember[] => {
  assertDifferentIds(fromUserId, toUserId, "owner transfer");
  assertSingleCircleOwner(members);

  const currentOwner = members.find((member) => member.userId === fromUserId);
  if (!currentOwner || currentOwner.role !== CircleRole.CircleOwner) {
    throw new Error("Current owner must be CircleOwner");
  }

  const target = members.find((member) => member.userId === toUserId);
  if (!target) {
    throw new Error("Target member not found");
  }

  const updated = members.map((member) => {
    if (member.userId === fromUserId) {
      return { ...member, role: CircleRole.CircleManager };
    }
    if (member.userId === toUserId) {
      return { ...member, role: CircleRole.CircleOwner };
    }
    return member;
  });

  assertSingleCircleOwner(updated);
  return updated;
};

export const assertCanWithdraw = (targetRole: CircleRole): void => {
  if (targetRole === CircleRole.CircleOwner) {
    throw new Error(
      "Owner cannot withdraw from circle. Use transferOwnership instead",
    );
  }
};

export const assertCanWithdrawFromSession = (
  targetRole: CircleSessionRole,
): void => {
  if (targetRole === CircleSessionRole.CircleSessionOwner) {
    throw new Error(
      "Owner cannot withdraw from session. Use transferOwnership instead",
    );
  }
};

export const assertCanRemoveCircleMember = (targetRole: CircleRole): void => {
  if (targetRole === CircleRole.CircleOwner) {
    throw new Error("Use transferOwnership to remove owner");
  }
};

export const assertCanChangeCircleMemberRole = (
  currentRole: CircleRole,
  newRole: CircleRole,
): void => {
  if (newRole === CircleRole.CircleOwner) {
    throw new Error("Use transferOwnership to assign owner");
  }
  if (currentRole === CircleRole.CircleOwner) {
    throw new Error("Use transferOwnership to change owner");
  }
};

export const assertCanRemoveCircleSessionMember = (
  targetRole: CircleSessionRole,
): void => {
  if (targetRole === CircleSessionRole.CircleSessionOwner) {
    throw new Error("Use transferOwnership to remove owner");
  }
};

export const assertCanChangeCircleSessionMemberRole = (
  currentRole: CircleSessionRole,
  newRole: CircleSessionRole,
): void => {
  if (newRole === CircleSessionRole.CircleSessionOwner) {
    throw new Error("Use transferOwnership to assign owner");
  }
  if (currentRole === CircleSessionRole.CircleSessionOwner) {
    throw new Error("Use transferOwnership to change owner");
  }
};

export const transferCircleSessionOwnership = (
  members: CircleSessionMember[],
  fromUserId: UserId,
  toUserId: UserId,
): CircleSessionMember[] => {
  assertDifferentIds(fromUserId, toUserId, "owner transfer");
  assertSingleCircleSessionOwner(members);

  const currentOwner = members.find((member) => member.userId === fromUserId);
  if (
    !currentOwner ||
    currentOwner.role !== CircleSessionRole.CircleSessionOwner
  ) {
    throw new Error("Current owner must be CircleSessionOwner");
  }

  const target = members.find((member) => member.userId === toUserId);
  if (!target) {
    throw new Error("Target member not found");
  }

  const updated = members.map((member) => {
    if (member.userId === fromUserId) {
      return { ...member, role: CircleSessionRole.CircleSessionManager };
    }
    if (member.userId === toUserId) {
      return { ...member, role: CircleSessionRole.CircleSessionOwner };
    }
    return member;
  });

  assertSingleCircleSessionOwner(updated);
  return updated;
};
