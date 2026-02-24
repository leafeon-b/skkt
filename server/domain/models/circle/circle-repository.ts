import type { Circle } from "@/server/domain/models/circle/circle";
import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/models/circle/circle-role";

export type CircleRepository = {
  findById(id: CircleId): Promise<Circle | null>;
  findByIds(ids: readonly CircleId[]): Promise<Circle[]>;
  save(circle: Circle): Promise<void>;
  delete(id: CircleId): Promise<void>;
  listMembershipsByCircleId(circleId: CircleId): Promise<CircleMembership[]>;
  listMembershipsByUserId(userId: UserId): Promise<CircleMembership[]>;
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
