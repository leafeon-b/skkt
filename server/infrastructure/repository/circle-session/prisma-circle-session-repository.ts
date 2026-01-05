import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import { prisma } from "@/server/infrastructure/db";
import {
  mapCircleSessionToDomain,
  mapCircleSessionToPersistence,
} from "@/server/infrastructure/mappers/circle-session-mapper";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleId, CircleSessionId } from "@/server/domain/common/ids";

export const prismaCircleSessionRepository: CircleSessionRepository = {
  async findById(id: CircleSessionId): Promise<CircleSession | null> {
    const found = await prisma.circleSession.findUnique({
      where: { id: id as string },
    });

    return found ? mapCircleSessionToDomain(found) : null;
  },

  async listByCircleId(circleId: CircleId): Promise<CircleSession[]> {
    const sessions = await prisma.circleSession.findMany({
      where: { circleId: circleId as string },
      orderBy: { sequence: "asc" },
    });

    return sessions.map(mapCircleSessionToDomain);
  },

  async save(session: CircleSession): Promise<void> {
    const data = mapCircleSessionToPersistence(session);

    await prisma.circleSession.upsert({
      where: { id: data.id },
      update: {
        sequence: data.sequence,
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
    await prisma.circleSession.delete({ where: { id: id as string } });
  },
};
