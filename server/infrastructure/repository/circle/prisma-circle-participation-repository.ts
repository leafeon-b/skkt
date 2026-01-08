import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/services/authz/roles";
import type { CircleParticipant } from "@/server/domain/models/circle/circle-participant";
import { prisma } from "@/server/infrastructure/db";
import {
  mapCircleIdToPersistence,
  mapCircleParticipantFromPersistence,
  mapCircleRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-participation-mapper";

export const prismaCircleParticipationRepository: CircleParticipationRepository =
  {
    async listParticipants(circleId: CircleId): Promise<CircleParticipant[]> {
      const persistedCircleId = mapCircleIdToPersistence(circleId);

      const participants = await prisma.circleMembership.findMany({
        where: { circleId: persistedCircleId },
        select: { userId: true, role: true },
      });

      return participants.map(mapCircleParticipantFromPersistence);
    },

    async listByUserId(userId: UserId): Promise<CircleParticipant[]> {
      const participants = await prisma.circleMembership.findMany({
        where: { userId: userId as string },
        select: { userId: true, role: true },
      });

      return participants.map(mapCircleParticipantFromPersistence);
    },

    async addParticipant(
      circleId: CircleId,
      userId: UserId,
      role: CircleRole,
    ): Promise<void> {
      const persistedCircleId = mapCircleIdToPersistence(circleId);
      const persistedRole = mapCircleRoleToPersistence(role);

      await prisma.circleMembership.create({
        data: {
          circleId: persistedCircleId,
          userId: userId as string,
          role: persistedRole,
        },
      });
    },

    async updateParticipantRole(
      circleId: CircleId,
      userId: UserId,
      role: CircleRole,
    ): Promise<void> {
      const persistedCircleId = mapCircleIdToPersistence(circleId);
      const persistedRole = mapCircleRoleToPersistence(role);

      await prisma.circleMembership.update({
        where: {
          userId_circleId: {
            userId: userId as string,
            circleId: persistedCircleId,
          },
        },
        data: {
          role: persistedRole,
        },
      });
    },

    async removeParticipant(circleId: CircleId, userId: UserId): Promise<void> {
      const persistedCircleId = mapCircleIdToPersistence(circleId);

      await prisma.circleMembership.deleteMany({
        where: {
          circleId: persistedCircleId,
          userId: userId as string,
        },
      });
    },
  };
