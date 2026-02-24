import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleMembership } from "@/server/domain/models/circle-membership/circle-membership";
import type { CircleRole } from "@/server/domain/services/authz/roles";

export type CircleMembershipRepository = {
  listByCircleId(circleId: CircleId): Promise<CircleMembership[]>;
  listByUserId(userId: UserId): Promise<CircleMembership[]>;
  addMembership(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void>;
  updateMembershipRole(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void>;
  removeMembership(circleId: CircleId, userId: UserId): Promise<void>;
};
