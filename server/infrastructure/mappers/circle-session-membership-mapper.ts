import { toCircleSessionId, toUserId } from "@/server/domain/common/ids";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import type { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import type { CircleSessionRole as PrismaCircleSessionRole } from "@/generated/prisma/enums";

export const mapCircleSessionRoleToPersistence = (
  role: CircleSessionRole,
): PrismaCircleSessionRole => role as PrismaCircleSessionRole;

export const mapCircleSessionRoleFromPersistence = (
  role: PrismaCircleSessionRole,
): CircleSessionRole => role as CircleSessionRole;

export const mapCircleSessionMembershipFromPersistence = (input: {
  userId: string;
  role: PrismaCircleSessionRole;
  circleSessionId: string;
  createdAt: Date;
  deletedAt: Date | null;
}): CircleSessionMembership => ({
  circleSessionId: toCircleSessionId(input.circleSessionId),
  userId: toUserId(input.userId),
  role: mapCircleSessionRoleFromPersistence(input.role),
  createdAt: input.createdAt,
  deletedAt: input.deletedAt,
});
