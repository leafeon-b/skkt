import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import { prisma } from "@/server/infrastructure/db";
import type { Circle } from "@/server/domain/models/circle/circle";
import type { CircleId } from "@/server/domain/common/ids";
import {
  mapCircleToDomain,
  mapCircleToPersistence,
} from "@/server/infrastructure/mappers/circle-mapper";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";

export const prismaCircleRepository: CircleRepository = {
  async findById(id: CircleId): Promise<Circle | null> {
    const found = await prisma.circle.findUnique({
      where: { id: toPersistenceId(id) },
    });

    return found ? mapCircleToDomain(found) : null;
  },

  async findByIds(ids: readonly CircleId[]): Promise<Circle[]> {
    if (ids.length === 0) {
      return [];
    }
    const uniqueIds = Array.from(new Set(toPersistenceIds(ids)));
    const circles = await prisma.circle.findMany({
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

    await prisma.circle.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
      },
      create: data,
    });
  },

  async delete(id: CircleId): Promise<void> {
    await prisma.circle.delete({ where: { id: toPersistenceId(id) } });
  },
};
