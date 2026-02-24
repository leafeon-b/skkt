import { circleId, userId } from "@/server/domain/common/ids";
import type { CircleMembership } from "@/server/domain/models/circle-membership/circle-membership";
import type { CircleRole } from "@/server/domain/services/authz/roles";
import type { CircleRole as PrismaCircleRole } from "@/generated/prisma/enums";

export const mapCircleRoleToPersistence = (
  role: CircleRole,
): PrismaCircleRole => role as PrismaCircleRole;

export const mapCircleRoleFromPersistence = (
  role: PrismaCircleRole,
): CircleRole => role as CircleRole;

export const mapCircleMembershipFromPersistence = (input: {
  userId: string;
  role: PrismaCircleRole;
  circleId: string;
  createdAt: Date;
  deletedAt: Date | null;
}): CircleMembership => ({
  circleId: circleId(input.circleId),
  userId: userId(input.userId),
  role: mapCircleRoleFromPersistence(input.role),
  createdAt: input.createdAt,
  deletedAt: input.deletedAt,
});
