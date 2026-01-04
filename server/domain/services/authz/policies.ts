import {
  isSameOrHigherCircleRole,
  isSameOrHigherCircleSessionRole,
} from "@/server/domain/services/authz/roles";
import {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";
import type {
  CircleMembership,
  CircleSessionMembership,
} from "@/server/domain/services/authz/memberships";
import {
  isCircleMember,
  isCircleSessionMember,
} from "@/server/domain/services/authz/memberships";

const { CircleOwner, CircleManager, CircleMember } = CircleRole;
const { CircleSessionOwner, CircleSessionManager, CircleSessionMember } =
  CircleSessionRole;

export function canCreateCircle(isRegistered: boolean): boolean {
  return isRegistered;
}

export function canListOwnCircles(isRegistered: boolean): boolean {
  return isRegistered;
}

export function canViewUser(isRegistered: boolean): boolean {
  return isRegistered;
}

export function canViewCircle(membership: CircleMembership): boolean {
  return isCircleMember(membership);
}

export function canEditCircle(membership: CircleMembership): boolean {
  return (
    isCircleMember(membership) &&
    (membership.role === CircleOwner || membership.role === CircleManager)
  );
}

export function canDeleteCircle(membership: CircleMembership): boolean {
  return isCircleMember(membership) && membership.role === CircleOwner;
}

export function canAddCircleMember(membership: CircleMembership): boolean {
  return isCircleMember(membership);
}

export function canRemoveCircleMember(membership: CircleMembership): boolean {
  return (
    isCircleMember(membership) &&
    (membership.role === CircleOwner || membership.role === CircleManager)
  );
}

export function canChangeCircleMemberRole(
  actorMembership: CircleMembership,
  targetMembership: CircleMembership,
): boolean {
  if (!isCircleMember(actorMembership) || !isCircleMember(targetMembership)) {
    return false;
  }
  if (actorMembership.role === CircleMember) {
    return false;
  }
  return isSameOrHigherCircleRole(actorMembership.role, targetMembership.role);
}

export function canTransferCircleOwnership(
  membership: CircleMembership,
): boolean {
  return isCircleMember(membership) && membership.role === CircleOwner;
}

export function canCreateCircleSession(membership: CircleMembership): boolean {
  return (
    isCircleMember(membership) &&
    (membership.role === CircleOwner || membership.role === CircleManager)
  );
}

export function canViewCircleSession(
  circleMembership: CircleMembership,
  sessionMembership: CircleSessionMembership,
): boolean {
  return (
    isCircleMember(circleMembership) || isCircleSessionMember(sessionMembership)
  );
}

export function canEditCircleSession(
  membership: CircleSessionMembership,
): boolean {
  return (
    isCircleSessionMember(membership) &&
    (membership.role === CircleSessionOwner ||
      membership.role === CircleSessionManager)
  );
}

export function canDeleteCircleSession(
  membership: CircleSessionMembership,
): boolean {
  return (
    isCircleSessionMember(membership) && membership.role === CircleSessionOwner
  );
}

export function canAddCircleSessionMember(
  membership: CircleSessionMembership,
): boolean {
  return isCircleSessionMember(membership);
}

export function canRemoveCircleSessionMember(
  membership: CircleSessionMembership,
): boolean {
  return (
    isCircleSessionMember(membership) &&
    (membership.role === CircleSessionOwner ||
      membership.role === CircleSessionManager)
  );
}

export function canChangeCircleSessionMemberRole(
  actorMembership: CircleSessionMembership,
  targetMembership: CircleSessionMembership,
): boolean {
  if (
    !isCircleSessionMember(actorMembership) ||
    !isCircleSessionMember(targetMembership)
  ) {
    return false;
  }
  if (actorMembership.role === CircleSessionMember) {
    return false;
  }
  return isSameOrHigherCircleSessionRole(
    actorMembership.role,
    targetMembership.role,
  );
}

export function canTransferCircleSessionOwnership(
  membership: CircleSessionMembership,
): boolean {
  return (
    isCircleSessionMember(membership) && membership.role === CircleSessionOwner
  );
}

export function canRecordMatch(
  circleMembership: CircleMembership,
  sessionMembership: CircleSessionMembership,
): boolean {
  return (
    isCircleMember(circleMembership) || isCircleSessionMember(sessionMembership)
  );
}

export function canViewMatch(
  circleMembership: CircleMembership,
  sessionMembership: CircleSessionMembership,
): boolean {
  return (
    isCircleMember(circleMembership) || isCircleSessionMember(sessionMembership)
  );
}

export function canEditMatch(
  circleMembership: CircleMembership,
  sessionMembership: CircleSessionMembership,
): boolean {
  return (
    isCircleMember(circleMembership) || isCircleSessionMember(sessionMembership)
  );
}

export function canDeleteMatch(
  circleMembership: CircleMembership,
  sessionMembership: CircleSessionMembership,
): boolean {
  return (
    isCircleMember(circleMembership) || isCircleSessionMember(sessionMembership)
  );
}

export function canViewMatchHistory(
  circleMembership: CircleMembership,
  sessionMembership: CircleSessionMembership,
): boolean {
  return (
    isCircleMember(circleMembership) || isCircleSessionMember(sessionMembership)
  );
}
