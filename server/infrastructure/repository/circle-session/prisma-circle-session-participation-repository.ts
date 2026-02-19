import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type {
  CircleId,
  CircleSessionId,
  UserId,
} from "@/server/domain/common/ids";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleSessionParticipationFromPersistence,
  mapCircleSessionRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-session-participation-mapper";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";
import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";

export const createPrismaCircleSessionParticipationRepository = (
  client: PrismaClientLike,
): CircleSessionParticipationRepository => ({
  async listParticipations(
    circleSessionId: CircleSessionId,
  ): Promise<CircleSessionParticipation[]> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);

    const participations = await client.circleSessionMembership.findMany({
      where: { circleSessionId: persistedCircleSessionId },
      select: { circleSessionId: true, userId: true, role: true },
    });

    return participations.map(mapCircleSessionParticipationFromPersistence);
  },

  async listByUserId(userId: UserId): Promise<CircleSessionParticipation[]> {
    const persistedUserId = toPersistenceId(userId);

    const participations = await client.circleSessionMembership.findMany({
      where: { userId: persistedUserId },
      select: { circleSessionId: true, userId: true, role: true },
    });

    return participations.map(mapCircleSessionParticipationFromPersistence);
  },

  async addParticipation(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);
    const persistedUserId = toPersistenceId(userId);
    const persistedRole = mapCircleSessionRoleToPersistence(role);

    await client.circleSessionMembership.create({
      data: {
        circleSessionId: persistedCircleSessionId,
        userId: persistedUserId,
        role: persistedRole,
      },
    });
  },

  async updateParticipationRole(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);
    const persistedUserId = toPersistenceId(userId);
    const persistedRole = mapCircleSessionRoleToPersistence(role);

    const existing = await client.circleSessionMembership.findFirst({
      where: {
        userId: persistedUserId,
        circleSessionId: persistedCircleSessionId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new Error("CircleSessionMembership not found");
    }
    await client.circleSessionMembership.update({
      where: { id: existing.id },
      data: { role: persistedRole },
    });
  },

  async areUsersParticipating(
    circleSessionId: CircleSessionId,
    userIds: readonly UserId[],
  ): Promise<boolean> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);
    const uniqueIds = Array.from(new Set(toPersistenceIds(userIds)));
    if (uniqueIds.length === 0) {
      return false;
    }

    const count = await client.circleSessionMembership.count({
      where: {
        circleSessionId: persistedCircleSessionId,
        userId: { in: uniqueIds },
      },
    });

    return count === uniqueIds.length;
  },

  async removeParticipation(
    circleSessionId: CircleSessionId,
    userId: UserId,
  ): Promise<void> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);
    const persistedUserId = toPersistenceId(userId);

    await client.circleSessionMembership.deleteMany({
      where: {
        circleSessionId: persistedCircleSessionId,
        userId: persistedUserId,
      },
    });
  },

  async removeAllByCircleAndUser(
    circleId: CircleId,
    userId: UserId,
  ): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedUserId = toPersistenceId(userId);

    await client.circleSessionMembership.deleteMany({
      where: {
        userId: persistedUserId,
        session: { circleId: persistedCircleId },
      },
    });
  },
});

export const prismaCircleSessionParticipationRepository =
  createPrismaCircleSessionParticipationRepository(prisma);
