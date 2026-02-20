import { circleSessionId, userId } from "@/server/domain/common/ids";
import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";
import type { CircleSessionRole as PrismaCircleSessionRole } from "@/generated/prisma/enums";

export const mapCircleSessionRoleToPersistence = (
  role: CircleSessionRole,
): PrismaCircleSessionRole => role as PrismaCircleSessionRole;

export const mapCircleSessionRoleFromPersistence = (
  role: PrismaCircleSessionRole,
): CircleSessionRole => role as CircleSessionRole;

export const mapCircleSessionParticipationFromPersistence = (input: {
  userId: string;
  role: PrismaCircleSessionRole;
  circleSessionId: string;
  createdAt: Date;
  deletedAt: Date | null;
}): CircleSessionParticipation => ({
  circleSessionId: circleSessionId(input.circleSessionId),
  userId: userId(input.userId),
  role: mapCircleSessionRoleFromPersistence(input.role),
  createdAt: input.createdAt,
  deletedAt: input.deletedAt,
});
