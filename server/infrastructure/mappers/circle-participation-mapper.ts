import { circleId, userId } from "@/server/domain/common/ids";
import type { CircleParticipation } from "@/server/domain/models/circle/circle-participation";
import type { CircleRole } from "@/server/domain/services/authz/roles";
import type { CircleRole as PrismaCircleRole } from "@/generated/prisma/enums";

export const mapCircleRoleToPersistence = (
  role: CircleRole,
): PrismaCircleRole => role as PrismaCircleRole;

export const mapCircleRoleFromPersistence = (
  role: PrismaCircleRole,
): CircleRole => role as CircleRole;

export const mapCircleParticipationFromPersistence = (input: {
  userId: string;
  role: PrismaCircleRole;
  circleId: string;
  createdAt: Date;
}): CircleParticipation => ({
  circleId: circleId(input.circleId),
  userId: userId(input.userId),
  role: mapCircleRoleFromPersistence(input.role),
  createdAt: input.createdAt,
});
