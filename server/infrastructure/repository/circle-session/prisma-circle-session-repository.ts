import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleSessionToDomain,
  mapCircleSessionToPersistence,
} from "@/server/infrastructure/mappers/circle-session-mapper";
import {
  mapCircleSessionMembershipFromPersistence,
  mapCircleSessionRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-session-membership-mapper";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import type {
  CircleId,
  CircleSessionId,
  UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";
import { Prisma } from "@/generated/prisma/client";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";

export const createPrismaCircleSessionRepository = (
  client: PrismaClientLike,
): CircleSessionRepository => ({
  async findById(id: CircleSessionId): Promise<CircleSession | null> {
    const found = await client.circleSession.findUnique({
      where: { id: toPersistenceId(id) },
    });

    return found ? mapCircleSessionToDomain(found) : null;
  },

  async findByIds(ids: readonly CircleSessionId[]): Promise<CircleSession[]> {
    if (ids.length === 0) {
      return [];
    }
    const uniqueIds = Array.from(new Set(toPersistenceIds(ids)));
    const sessions = await client.circleSession.findMany({
      where: { id: { in: uniqueIds } },
    });
    const byId = new Map(
      sessions.map((session) => [
        session.id,
        mapCircleSessionToDomain(session),
      ]),
    );
    return uniqueIds
      .map((id) => byId.get(id))
      .filter((session): session is CircleSession => session != null);
  },

  async listByCircleId(circleId: CircleId): Promise<CircleSession[]> {
    const sessions = await client.circleSession.findMany({
      where: { circleId: toPersistenceId(circleId) },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
    });

    return sessions.map(mapCircleSessionToDomain);
  },

  async save(session: CircleSession): Promise<void> {
    const data = mapCircleSessionToPersistence(session);

    await client.circleSession.upsert({
      where: { id: data.id },
      update: {
        title: data.title,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        location: data.location,
        note: data.note,
      },
      create: data,
    });
  },

  async delete(id: CircleSessionId): Promise<void> {
    await client.circleSession.delete({ where: { id: toPersistenceId(id) } });
  },

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

  async listMembershipsByUserId(
    userId: UserId,
  ): Promise<CircleSessionMembership[]> {
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
    deletedAt: Date,
  ): Promise<void> {
    const persistedCircleSessionId = toPersistenceId(circleSessionId);
    const persistedUserId = toPersistenceId(userId);

    const result = await client.circleSessionMembership.updateMany({
      where: {
        circleSessionId: persistedCircleSessionId,
        userId: persistedUserId,
        deletedAt: null,
      },
      data: { deletedAt },
    });
    if (result.count === 0) {
      throw new NotFoundError("CircleSessionMembership");
    }
  },
});

export const prismaCircleSessionRepository =
  createPrismaCircleSessionRepository(prisma);
