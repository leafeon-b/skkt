import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleParticipation } from "@/server/domain/models/circle/circle-participation";
import type { CircleRole } from "@/server/domain/services/authz/roles";

export type CircleParticipationRepository = {
  listParticipations(circleId: CircleId): Promise<CircleParticipation[]>;
  listByUserId(userId: UserId): Promise<CircleParticipation[]>;
  addParticipation(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void>;
  updateParticipationRole(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void>;
  removeParticipation(circleId: CircleId, userId: UserId): Promise<void>;
};
