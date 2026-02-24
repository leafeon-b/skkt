import type { CircleSessionId, UserId } from "@/server/domain/common/ids";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";

export type CircleSessionMembership = {
  circleSessionId: CircleSessionId;
  userId: UserId;
  role: CircleSessionRole;
  createdAt: Date;
  deletedAt: Date | null;
};
