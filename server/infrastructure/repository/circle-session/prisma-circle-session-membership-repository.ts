import type { CircleSessionMembershipRepository } from "@/server/domain/models/circle-session/circle-session-membership-repository";
import type { CircleSessionId, UserId } from "@/server/domain/common/ids";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleSessionMembershipFromPersistence,
  mapCircleSessionRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-session-membership-mapper";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";
import { Prisma } from "@/generated/prisma/client";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";

export const createPrismaCircleSessionMembershipRepository = (
  client: PrismaClientLike,
): CircleSessionMembershipRepository => ({
  async listMemberships(
    circleSessionId: CircleSessionId,
  ): Promise<CircleSessionMembership[]> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);

    const memberships = await client.circleSessionMembership.findMany({
      where: { circleSessionId: persistedCircleSessionId, deletedAt: null },
      select: {
        circleSessionId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    return memberships.map(mapCircleSessionMembershipFromPersistence);
  },

  async listByUserId(userId: UserId): Promise<CircleSessionMembership[]> {
    const persistedUserId = toPersistenceId(userId);

    const memberships = await client.circleSessionMembership.findMany({
      where: { userId: persistedUserId, deletedAt: null },
      select: {
        circleSessionId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    return memberships.map(mapCircleSessionMembershipFromPersistence);
  },

  async addMembership(
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
        throw new ConflictError("Membership already exists");
      }
      throw error;
    }
  },

  async updateMembershipRole(
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

  async removeMembership(
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

export const prismaCircleSessionMembershipRepository =
  createPrismaCircleSessionMembershipRepository(prisma);
