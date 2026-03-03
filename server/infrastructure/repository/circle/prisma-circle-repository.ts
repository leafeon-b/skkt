import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import type { Circle } from "@/server/domain/models/circle/circle";
import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/models/circle/circle-role";
import {
  mapCircleToDomain,
  mapCircleToPersistence,
} from "@/server/infrastructure/mappers/circle-mapper";
import {
  mapCircleMembershipFromPersistence,
  mapCircleRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-membership-mapper";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";
import { Prisma } from "@/generated/prisma/client";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";

export const createPrismaCircleRepository = (
  client: PrismaClientLike,
): CircleRepository => ({
  async findById(id: CircleId): Promise<Circle | null> {
    const found = await client.circle.findUnique({
      where: { id: toPersistenceId(id) },
    });

    return found ? mapCircleToDomain(found) : null;
  },

  async findByIds(ids: readonly CircleId[]): Promise<Circle[]> {
    if (ids.length === 0) {
      return [];
    }
    const uniqueIds = Array.from(new Set(toPersistenceIds(ids)));
    const circles = await client.circle.findMany({
      where: { id: { in: uniqueIds } },
    });
    const byId = new Map(
      circles.map((circle) => [circle.id, mapCircleToDomain(circle)]),
    );
    return uniqueIds
      .map((id) => byId.get(id))
      .filter((circle): circle is Circle => circle != null);
  },

  async save(circle: Circle): Promise<void> {
    const data = mapCircleToPersistence(circle);

    await client.circle.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
      },
      create: data,
    });
  },

  async delete(id: CircleId): Promise<void> {
    await client.circle.delete({ where: { id: toPersistenceId(id) } });
  },

  async findMembershipByCircleAndUser(
    circleId: CircleId,
    userId: UserId,
  ): Promise<CircleMembership | null> {
    const found = await client.circleMembership.findFirst({
      where: {
        circleId: toPersistenceId(circleId),
        userId: toPersistenceId(userId),
        deletedAt: null,
      },
      select: {
        circleId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    return found ? mapCircleMembershipFromPersistence(found) : null;
  },

  async listMembershipsByCircleId(
    circleId: CircleId,
  ): Promise<CircleMembership[]> {
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

  async listMembershipsByUserId(userId: UserId): Promise<CircleMembership[]> {
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
        const target = error.meta?.target;
        if (
          Array.isArray(target) &&
          target.includes("userId") &&
          target.includes("circleId")
        ) {
          throw new ConflictError("Membership already exists");
        }
        throw error;
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

  async removeMembership(
    circleId: CircleId,
    userId: UserId,
    deletedAt: Date,
  ): Promise<void> {
    const persistedCircleId = toPersistenceId(circleId);
    const persistedUserId = toPersistenceId(userId);

    const result = await client.circleMembership.updateMany({
      where: {
        circleId: persistedCircleId,
        userId: persistedUserId,
        deletedAt: null,
      },
      data: { deletedAt },
    });
    if (result.count === 0) {
      throw new NotFoundError("CircleMembership");
    }
  },
});

export const prismaCircleRepository = createPrismaCircleRepository(prisma);
