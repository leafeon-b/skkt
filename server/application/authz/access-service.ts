import * as policies from "@/server/domain/services/authz/policies";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";

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
      return policies.canCreateCircle(isRegistered);
    },

    async canListOwnCircles(userId: string): Promise<boolean> {
      const isRegistered = await repository.isRegisteredUser(userId);
      return policies.canListOwnCircles(isRegistered);
    },

    async canViewUser(userId: string): Promise<boolean> {
      const isRegistered = await repository.isRegisteredUser(userId);
      return policies.canViewUser(isRegistered);
    },

    async canViewCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return policies.canViewCircle(membership);
    },

    async canEditCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return policies.canEditCircle(membership);
    },

    async canDeleteCircle(userId: string, circleId: string): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return policies.canDeleteCircle(membership);
    },

    async canAddCircleMember(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return policies.canAddCircleMember(membership);
    },

    async canRemoveCircleMember(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return policies.canRemoveCircleMember(membership);
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
      return policies.canChangeCircleMemberRole(
        actorMembership,
        targetMembership,
      );
    },

    async canTransferCircleOwnership(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return policies.canTransferCircleOwnership(membership);
    },

    async canCreateCircleSession(
      userId: string,
      circleId: string,
    ): Promise<boolean> {
      const membership = await findCircleMembership(userId, circleId);
      return policies.canCreateCircleSession(membership);
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
      return policies.canViewCircleSession(circleMembership, sessionMembership);
    },

    async canEditCircleSession(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return policies.canEditCircleSession(membership);
    },

    async canDeleteCircleSession(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return policies.canDeleteCircleSession(membership);
    },

    async canAddCircleSessionMember(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return policies.canAddCircleSessionMember(membership);
    },

    async canRemoveCircleSessionMember(
      userId: string,
      circleSessionId: string,
    ): Promise<boolean> {
      const membership = await findCircleSessionMembership(
        userId,
        circleSessionId,
      );
      return policies.canRemoveCircleSessionMember(membership);
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
      return policies.canChangeCircleSessionMemberRole(
        actorMembership,
        targetMembership,
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
      return policies.canTransferCircleSessionOwnership(membership);
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
      return policies.canRecordMatch(circleMembership, sessionMembership);
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
      return policies.canViewMatch(circleMembership, sessionMembership);
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
      return policies.canEditMatch(circleMembership, sessionMembership);
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
      return policies.canDeleteMatch(circleMembership, sessionMembership);
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
      return policies.canViewMatchHistory(circleMembership, sessionMembership);
    },
  };
}
