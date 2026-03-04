import type { PrismaClient } from "@/generated/prisma/client";
import type { RoundRobinScheduleRepository } from "@/server/domain/models/round-robin-schedule/round-robin-schedule-repository";
import { prisma } from "@/server/infrastructure/db";
import {
  mapRoundRobinScheduleToDomain,
  mapRoundRobinScheduleToPersistence,
} from "@/server/infrastructure/mappers/round-robin-schedule-mapper";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { CircleSessionId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const createPrismaRoundRobinScheduleRepository = (
  client: PrismaClient,
): RoundRobinScheduleRepository => ({
  async findByCircleSessionId(
    circleSessionId: CircleSessionId,
  ): Promise<RoundRobinSchedule | null> {
    const found = await client.roundRobinSchedule.findUnique({
      where: { circleSessionId: toPersistenceId(circleSessionId) },
      include: { rounds: { include: { pairings: true } } },
    });

    return found ? mapRoundRobinScheduleToDomain(found) : null;
  },

  async save(schedule: RoundRobinSchedule): Promise<void> {
    const data = mapRoundRobinScheduleToPersistence(schedule);

    await client.$transaction(async (tx) => {
      await tx.roundRobinSchedule.deleteMany({
        where: { circleSessionId: data.circleSessionId },
      });

      await tx.roundRobinSchedule.create({ data });
    });
  },

  async deleteByCircleSessionId(
    circleSessionId: CircleSessionId,
  ): Promise<void> {
    await client.roundRobinSchedule.deleteMany({
      where: { circleSessionId: toPersistenceId(circleSessionId) },
    });
  },
});

export const prismaRoundRobinScheduleRepository =
  createPrismaRoundRobinScheduleRepository(prisma);
