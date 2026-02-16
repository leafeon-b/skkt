import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import {
  isCircleMember,
  isCircleSessionMember,
} from "@/server/domain/services/authz/memberships";
import {
  CircleRole,
  CircleSessionRole,
  isSameOrHigherCircleRole,
  isSameOrHigherCircleSessionRole,
} from "@/server/domain/services/authz/roles";

const { CircleOwner, CircleManager, CircleMember } = CircleRole;
const { CircleSessionOwner, CircleSessionManager, CircleSessionMember } =
  CircleSessionRole;

export function createAccessService(repository: AuthzRepository) {
  const findCircleMembership = (userId: string, circleId: string) =>
    repository.findCircleMembership(userId, circleId);

  const findCircleSessionMembership = (
    userId: string,
    circleSessionId: string,
  ) => repository.findCircleSessionMembership(userId, circleSessionId);

  return {
    async canCreateCircle(userId: string): Promise<boolean> {
      const isRegistered = await repository.isRegisteredUser(userId);
      return isRegistered;
    },

    async canListOwnCircles(userId: string): Promise<boolean> {
      const isRegistered = await repository.isRegisteredUser(userId);
      return isRegistered;
    },

    async canViewUser(userId: string): Promise<boolean> {
      const isRegistered = await repository.isRegisteredUser(userId);
      return isRegistered;
    },

    async canViewCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return isCircleMember(membership);
    },

    async canWithdrawFromCircle(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return isCircleMember(membership);
    },

    async canEditCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return (
        isCircleMember(membership) &&
        (membership.role === CircleOwner || membership.role === CircleManager)
      );
    },

    async canDeleteCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return isCircleMember(membership) && membership.role === CircleOwner;
    },

    async canAddCircleMember(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return isCircleMember(membership);
    },

    async canRemoveCircleMember(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return (
        isCircleMember(membership) &&
        (membership.role === CircleOwner || membership.role === CircleManager)
      );
    },

    async canChangeCircleMemberRole(
      actorId: string,
      targetId: string,
      circleId: string,
    ): Promise<boolean> {
      const [actorMembership, targetMembership] = await Promise.all([
        findCircleMembership(actorId, circleId),
        findCircleMembership(targetId, circleId),
      ]);
      if (
        !isCircleMember(actorMembership) ||
        !isCircleMember(targetMembership)
      ) {
        return false;
      }
      if (actorMembership.role === CircleMember) {
        return false;
      }
      return isSameOrHigherCircleRole(
        actorMembership.role,
        targetMembership.role,
      );
    },

    async canTransferCircleOwnership(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return isCircleMember(membership) && membership.role === CircleOwner;
    },

    async canCreateCircleSession(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return (
        isCircleMember(membership) &&
        (membership.role === CircleOwner || membership.role === CircleManager)
      );
    },

    async canViewCircleSession(
      userId: string,
      circleId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [circleMembership, sessionMembership] = await Promise.all([
        findCircleMembership(userId, circleId),
        findCircleSessionMembership(userId, circleSessionId),
      ]);
      return (
        isCircleMember(circleMembership) ||
        isCircleSessionMember(sessionMembership)
      );
    },

    async canEditCircleSession(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return (
        isCircleSessionMember(membership) &&
        (membership.role === CircleSessionOwner ||
          membership.role === CircleSessionManager)
      );
    },

    async canDeleteCircleSession(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return (
        isCircleSessionMember(membership) &&
        membership.role === CircleSessionOwner
      );
    },

    async canAddCircleSessionMember(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return isCircleSessionMember(membership);
    },

    async canRemoveCircleSessionMember(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return (
        isCircleSessionMember(membership) &&
        (membership.role === CircleSessionOwner ||
          membership.role === CircleSessionManager)
      );
    },

    async canChangeCircleSessionMemberRole(
      actorId: string,
      targetId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [actorMembership, targetMembership] = await Promise.all([
        findCircleSessionMembership(actorId, circleSessionId),
        findCircleSessionMembership(targetId, circleSessionId),
      ]);
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
    },

    async canTransferCircleSessionOwnership(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return (
        isCircleSessionMember(membership) &&
        membership.role === CircleSessionOwner
      );
    },

    async canRecordMatch(
      userId: string,
      circleId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [circleMembership, sessionMembership] = await Promise.all([
        findCircleMembership(userId, circleId),
        findCircleSessionMembership(userId, circleSessionId),
      ]);
      return (
        isCircleMember(circleMembership) ||
        isCircleSessionMember(sessionMembership)
      );
    },

    async canViewMatch(
      userId: string,
      circleId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [circleMembership, sessionMembership] = await Promise.all([
        findCircleMembership(userId, circleId),
        findCircleSessionMembership(userId, circleSessionId),
      ]);
      return (
        isCircleMember(circleMembership) ||
        isCircleSessionMember(sessionMembership)
      );
    },

    async canEditMatch(
      userId: string,
      circleId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [circleMembership, sessionMembership] = await Promise.all([
        findCircleMembership(userId, circleId),
        findCircleSessionMembership(userId, circleSessionId),
      ]);
      return (
        isCircleMember(circleMembership) ||
        isCircleSessionMember(sessionMembership)
      );
    },

    async canDeleteMatch(
      userId: string,
      circleId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [circleMembership, sessionMembership] = await Promise.all([
        findCircleMembership(userId, circleId),
        findCircleSessionMembership(userId, circleSessionId),
      ]);
      return (
        isCircleMember(circleMembership) ||
        isCircleSessionMember(sessionMembership)
      );
    },

    async canViewMatchHistory(
      userId: string,
      circleId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [circleMembership, sessionMembership] = await Promise.all([
        findCircleMembership(userId, circleId),
        findCircleSessionMembership(userId, circleSessionId),
      ]);
      return (
        isCircleMember(circleMembership) ||
        isCircleSessionMember(sessionMembership)
      );
    },
  };
}
