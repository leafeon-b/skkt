import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/services/authz/roles";

export type CircleParticipation = {
  circleId: CircleId;
  userId: UserId;
  role: CircleRole;
  createdAt: Date;
  deletedAt: Date | null;
};
