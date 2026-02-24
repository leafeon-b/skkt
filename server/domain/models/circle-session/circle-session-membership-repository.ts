import type { CircleSessionId, UserId } from "@/server/domain/common/ids";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";

export type CircleSessionMembershipRepository = {
  listMemberships(
    circleSessionId: CircleSessionId,
  ): Promise<CircleSessionMembership[]>;
  listByUserId(userId: UserId): Promise<CircleSessionMembership[]>;
  addMembership(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void>;
  updateMembershipRole(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void>;
  areUsersParticipating(
    circleSessionId: CircleSessionId,
    userIds: readonly UserId[],
  ): Promise<boolean>;
  removeMembership(
    circleSessionId: CircleSessionId,
    userId: UserId,
  ): Promise<void>;
};
