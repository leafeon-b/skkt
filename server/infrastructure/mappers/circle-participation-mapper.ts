import type { CircleId } from "@/server/domain/common/ids";
import { userId } from "@/server/domain/common/ids";
import type { CircleParticipant } from "@/server/domain/models/circle/circle-participant";
import type { CircleRole } from "@/server/domain/services/authz/roles";
import type { CircleRole as PrismaCircleRole } from "@/generated/prisma/enums";

export const mapCircleIdToPersistence = (id: CircleId): string => id as string;

export const mapCircleRoleToPersistence = (
  role: CircleRole,
): PrismaCircleRole => role as PrismaCircleRole;

export const mapCircleRoleFromPersistence = (
  role: PrismaCircleRole,
): CircleRole => role as CircleRole;

export const mapCircleParticipantFromPersistence = (input: {
  userId: string;
  role: PrismaCircleRole;
}): CircleParticipant => ({
  userId: userId(input.userId),
  role: mapCircleRoleFromPersistence(input.role),
});
