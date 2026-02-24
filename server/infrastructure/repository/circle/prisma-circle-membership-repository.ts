import type { CircleMembershipRepository } from "@/server/domain/models/circle/circle-membership-repository";
import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/services/authz/roles";
import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleMembershipFromPersistence,
  mapCircleRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-membership-mapper";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";
import { Prisma } from "@/generated/prisma/client";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const createPrismaCircleMembershipRepository = (
  client: PrismaClientLike,
): CircleMembershipRepository => ({
  async listByCircleId(circleId: CircleId): Promise<CircleMembership[]> {
    const persistedCircleId = toPersistenceId(circleId);

    const memberships = await client.circleMembership.findMany({
      where: { circleId: persistedCircleId, deletedAt: null },
      select: {
        circleId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    return memberships.map(mapCircleMembershipFromPersistence);
  },

  async listByUserId(userId: UserId): Promise<CircleMembership[]> {
    const memberships = await client.circleMembership.findMany({
      where: { userId: toPersistenceId(userId), deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        circleId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    return memberships.map(mapCircleMembershipFromPersistence);
  },

  async addMembership(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedRole = mapCircleRoleToPersistence(role);

    try {
      await client.circleMembership.create({
        data: {
          circleId: persistedCircleId,
          userId: toPersistenceId(userId),
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
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedRole = mapCircleRoleToPersistence(role);

    const result = await client.circleMembership.updateMany({
      where: {
        userId: toPersistenceId(userId),
        circleId: persistedCircleId,
        deletedAt: null,
      },
      data: { role: persistedRole },
    });
    if (result.count === 0) {
      throw new NotFoundError("CircleMembership");
    }
  },

  async removeMembership(circleId: CircleId, userId: UserId): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedUserId = toPersistenceId(userId);

    const result = await client.circleMembership.updateMany({
      where: {
        circleId: persistedCircleId,
        userId: persistedUserId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundError("CircleMembership");
    }
  },
});

export const prismaCircleMembershipRepository =
  createPrismaCircleMembershipRepository(prisma);
