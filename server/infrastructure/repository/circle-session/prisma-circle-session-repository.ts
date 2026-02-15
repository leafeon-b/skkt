import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleSessionToDomain,
  mapCircleSessionToPersistence,
} from "@/server/infrastructure/mappers/circle-session-mapper";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleId, CircleSessionId } from "@/server/domain/common/ids";
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
});

export const prismaCircleSessionRepository =
  createPrismaCircleSessionRepository(prisma);
