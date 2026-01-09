import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionId, UserId } from "@/server/domain/common/ids";
import { prisma } from "@/server/infrastructure/db";
import {
  mapCircleSessionIdToPersistence,
  mapCircleSessionParticipationFromPersistence,
  mapCircleSessionRoleToPersistence,
  mapUserIdsToPersistence,
} from "@/server/infrastructure/mappers/circle-session-participation-mapper";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";
import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";

export const prismaCircleSessionParticipationRepository: CircleSessionParticipationRepository =
  {
    async listParticipations(
      circleSessionId: CircleSessionId,
    ): Promise<CircleSessionParticipation[]> {
      const persistedCircleSessionId =
        mapCircleSessionIdToPersistence(circleSessionId);

      const participations = await prisma.circleSessionMembership.findMany({
        where: { circleSessionId: persistedCircleSessionId },
        select: { circleSessionId: true, userId: true, role: true },
      });

      return participations.map(mapCircleSessionParticipationFromPersistence);
    },

    async listByUserId(userId: UserId): Promise<CircleSessionParticipation[]> {
      const [persistedUserId] = mapUserIdsToPersistence([userId]);

      const participations = await prisma.circleSessionMembership.findMany({
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
      const persistedCircleSessionId =
        mapCircleSessionIdToPersistence(circleSessionId);
      const [persistedUserId] = mapUserIdsToPersistence([userId]);
      const persistedRole = mapCircleSessionRoleToPersistence(role);

      await prisma.circleSessionMembership.create({
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
      const persistedCircleSessionId =
        mapCircleSessionIdToPersistence(circleSessionId);
      const [persistedUserId] = mapUserIdsToPersistence([userId]);
      const persistedRole = mapCircleSessionRoleToPersistence(role);

      await prisma.circleSessionMembership.update({
        where: {
          userId_circleSessionId: {
            userId: persistedUserId,
            circleSessionId: persistedCircleSessionId,
          },
        },
        data: {
          role: persistedRole,
        },
      });
    },

    async areUsersParticipating(
      circleSessionId: CircleSessionId,
      userIds: readonly UserId[],
    ): Promise<boolean> {
      const persistedCircleSessionId =
        mapCircleSessionIdToPersistence(circleSessionId);
      const uniqueIds = Array.from(new Set(mapUserIdsToPersistence(userIds)));
      if (uniqueIds.length === 0) {
        return false;
      }

      const count = await prisma.circleSessionMembership.count({
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
      const persistedCircleSessionId =
        mapCircleSessionIdToPersistence(circleSessionId);
      const [persistedUserId] = mapUserIdsToPersistence([userId]);

      await prisma.circleSessionMembership.deleteMany({
        where: {
          circleSessionId: persistedCircleSessionId,
          userId: persistedUserId,
        },
      });
    },
  };
