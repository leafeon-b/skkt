import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionId, UserId } from "@/server/domain/common/ids";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleSessionParticipationFromPersistence,
  mapCircleSessionRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-session-participation-mapper";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";
import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";
import { Prisma } from "@/generated/prisma/client";
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
      where: { circleSessionId: persistedCircleSessionId, deletedAt: null },
      select: {
        circleSessionId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    return participations.map(mapCircleSessionParticipationFromPersistence);
  },

  async listByUserId(userId: UserId): Promise<CircleSessionParticipation[]> {
    const persistedUserId = toPersistenceId(userId);

    const participations = await client.circleSessionMembership.findMany({
      where: { userId: persistedUserId, deletedAt: null },
      select: {
        circleSessionId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
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

    try {
      await client.circleSessionMembership.create({
        data: {
          circleSessionId: persistedCircleSessionId,
          userId: persistedUserId,
          role: persistedRole,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Participation already exists");
      }
      throw error;
    }
  },

  async updateParticipationRole(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);
    const persistedUserId = toPersistenceId(userId);
    const persistedRole = mapCircleSessionRoleToPersistence(role);

    const result = await client.circleSessionMembership.updateMany({
      where: {
        userId: persistedUserId,
        circleSessionId: persistedCircleSessionId,
        deletedAt: null,
      },
      data: { role: persistedRole },
    });
    if (result.count === 0) {
      throw new NotFoundError("CircleSessionMembership");
    }
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
        deletedAt: null,
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

    const result = await client.circleSessionMembership.updateMany({
      where: {
        circleSessionId: persistedCircleSessionId,
        userId: persistedUserId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundError("CircleSessionMembership");
    }
  },
});

export const prismaCircleSessionParticipationRepository =
  createPrismaCircleSessionParticipationRepository(prisma);
