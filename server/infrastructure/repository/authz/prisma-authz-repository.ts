import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import {
  mapCircleMembershipFromPersistence,
  mapCircleSessionMembershipFromPersistence,
} from "@/server/infrastructure/mappers/authz-mapper";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";

export const createPrismaAuthzRepository = (
  client: PrismaClientLike,
): AuthzRepository => ({
  async isRegisteredUser(userId: string): Promise<boolean> {
    const found = await client.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return found != null;
  },

  async findCircleMembership(userId: string, circleId: string) {
    const membership = await client.circleMembership.findFirst({
      where: { userId, circleId, deletedAt: null },
      select: { role: true },
    });

    return mapCircleMembershipFromPersistence(membership?.role ?? null);
  },

  async findCircleSessionMembership(userId: string, circleSessionId: string) {
    const membership = await client.circleSessionMembership.findFirst({
      where: { userId, circleSessionId, deletedAt: null },
      select: { role: true },
    });

    return mapCircleSessionMembershipFromPersistence(membership?.role ?? null);
  },
});

export const prismaAuthzRepository = createPrismaAuthzRepository(prisma);
