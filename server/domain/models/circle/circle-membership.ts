import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/models/circle/circle-role";

export type CircleMembership = {
  circleId: CircleId;
  userId: UserId;
  role: CircleRole;
  createdAt: Date;
  deletedAt: Date | null;
};
