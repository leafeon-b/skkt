import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/services/authz/roles";
import type { CircleParticipation } from "@/server/domain/models/circle/circle-participation";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleParticipationFromPersistence,
  mapCircleRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-participation-mapper";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const createPrismaCircleParticipationRepository = (
  client: PrismaClientLike,
): CircleParticipationRepository => ({
  async listByCircleId(circleId: CircleId): Promise<CircleParticipation[]> {
    const persistedCircleId = toPersistenceId(circleId);

    const participations = await client.circleMembership.findMany({
      where: { circleId: persistedCircleId },
      select: { circleId: true, userId: true, role: true, createdAt: true },
    });

    return participations.map(mapCircleParticipationFromPersistence);
  },

  async listByUserId(userId: UserId): Promise<CircleParticipation[]> {
    const participations = await client.circleMembership.findMany({
      where: { userId: toPersistenceId(userId) },
      orderBy: { createdAt: "desc" },
      select: { circleId: true, userId: true, role: true, createdAt: true },
    });

    return participations.map(mapCircleParticipationFromPersistence);
  },

  async addParticipation(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedRole = mapCircleRoleToPersistence(role);

    await client.circleMembership.create({
      data: {
        circleId: persistedCircleId,
        userId: toPersistenceId(userId),
        role: persistedRole,
      },
    });
  },

  async updateParticipationRole(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedRole = mapCircleRoleToPersistence(role);

    await client.circleMembership.update({
      where: {
        userId_circleId: {
          userId: toPersistenceId(userId),
          circleId: persistedCircleId,
        },
      },
      data: {
        role: persistedRole,
      },
    });
  },

  async removeParticipation(circleId: CircleId, userId: UserId): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedUserId = toPersistenceId(userId);

    await client.circleSessionMembership.deleteMany({
      where: {
        userId: persistedUserId,
        session: { circleId: persistedCircleId },
      },
    });

    await client.circleMembership.deleteMany({
      where: {
        circleId: persistedCircleId,
        userId: persistedUserId,
      },
    });
  },
});

export const prismaCircleParticipationRepository =
  createPrismaCircleParticipationRepository(prisma);
