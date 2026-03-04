import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import { ProfileVisibility } from "@/server/domain/models/user/user";
import type { UserId } from "@/server/domain/common/ids";
import {
  isCircleMemberStatus,
  isCircleSessionMemberStatus,
} from "@/server/domain/services/authz/memberships";
import {
  CircleRole,
  isSameOrHigherCircleRole,
} from "@/server/domain/models/circle/circle-role";
import {
  CircleSessionRole,
  isSameOrHigherCircleSessionRole,
} from "@/server/domain/models/circle-session/circle-session-role";

const { CircleOwner, CircleManager, CircleMember } = CircleRole;
const { CircleSessionOwner, CircleSessionManager, CircleSessionMember } =
  CircleSessionRole;

export type AccessServiceDeps = {
  authzRepository: AuthzRepository;
  userRepository: UserRepository;
};

export function createAccessService(deps: AccessServiceDeps) {
  const repository = deps.authzRepository;
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
      return isCircleMemberStatus(membership);
    },

    async canWithdrawFromCircle(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return isCircleMemberStatus(membership);
    },

    async canEditCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return (
        isCircleMemberStatus(membership) &&
        (membership.role === CircleOwner || membership.role === CircleManager)
      );
    },

    async canDeleteCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return (
        isCircleMemberStatus(membership) && membership.role === CircleOwner
      );
    },

    async canAddCircleMember(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return isCircleMemberStatus(membership);
    },

    async canRemoveCircleMember(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return (
        isCircleMemberStatus(membership) &&
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
        !isCircleMemberStatus(actorMembership) ||
        !isCircleMemberStatus(targetMembership)
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
      return (
        isCircleMemberStatus(membership) && membership.role === CircleOwner
      );
    },

    async canCreateCircleSession(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return (
        isCircleMemberStatus(membership) &&
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
        isCircleMemberStatus(circleMembership) ||
        isCircleSessionMemberStatus(sessionMembership)
      );
    },

    async canWithdrawFromCircleSession(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return isCircleSessionMemberStatus(membership);
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
        isCircleSessionMemberStatus(membership) &&
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
        isCircleSessionMemberStatus(membership) &&
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
      return isCircleSessionMemberStatus(membership);
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
        isCircleSessionMemberStatus(membership) &&
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
        !isCircleSessionMemberStatus(actorMembership) ||
        !isCircleSessionMemberStatus(targetMembership)
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
        isCircleSessionMemberStatus(membership) &&
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
        isCircleMemberStatus(circleMembership) ||
        isCircleSessionMemberStatus(sessionMembership)
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
        isCircleMemberStatus(circleMembership) ||
        isCircleSessionMemberStatus(sessionMembership)
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
        isCircleMemberStatus(circleMembership) ||
        isCircleSessionMemberStatus(sessionMembership)
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
        isCircleMemberStatus(circleMembership) ||
        isCircleSessionMemberStatus(sessionMembership)
      );
    },

    async canManageRoundRobinSchedule(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return (
        isCircleSessionMemberStatus(membership) &&
        (membership.role === CircleSessionOwner ||
          membership.role === CircleSessionManager)
      );
    },

    async canViewRoundRobinSchedule(
      userId: string,
      circleId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const [circleMembership, sessionMembership] = await Promise.all([
        findCircleMembership(userId, circleId),
        findCircleSessionMembership(userId, circleSessionId),
      ]);
      return (
        isCircleMemberStatus(circleMembership) ||
        isCircleSessionMemberStatus(sessionMembership)
      );
    },

    async canViewUserProfile(
      actorId: UserId,
      targetUserId: UserId,
    ): Promise<boolean> {
      if (actorId === targetUserId) {
        return true;
      }
      const targetUser = await deps.userRepository.findById(targetUserId);
      if (!targetUser) {
        return false;
      }
      return targetUser.profileVisibility === ProfileVisibility.PUBLIC;
    },
  };
}
