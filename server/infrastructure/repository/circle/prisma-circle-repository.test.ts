import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circle: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import type { Circle as PrismaCircle } from "@/generated/prisma/client";
import { prisma } from "@/server/infrastructure/db";
import { circleId } from "@/server/domain/common/ids";
import { createCircle } from "@/server/domain/models/circle/circle";
import { prismaCircleRepository } from "@/server/infrastructure/repository/circle/prisma-circle-repository";
import { mapCircleToPersistence } from "@/server/infrastructure/mappers/circle-mapper";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma Circle リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("findById は Circle を返す", async () => {
    const prismaCircle = {
      id: "circle-1",
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    } as PrismaCircle;

    mockedPrisma.circle.findUnique.mockResolvedValueOnce(prismaCircle);

    const circle = await prismaCircleRepository.findById(circleId("circle-1"));

    expect(mockedPrisma.circle.findUnique).toHaveBeenCalledWith({
      where: { id: "circle-1" },
    });
    expect(circle?.id).toBe("circle-1");
  });

  test("findById は未取得時に null を返す", async () => {
    mockedPrisma.circle.findUnique.mockResolvedValueOnce(null);

    const circle = await prismaCircleRepository.findById(circleId("circle-1"));

    expect(circle).toBeNull();
  });

  test("save は upsert を呼ぶ", async () => {
    const circle = createCircle({
      id: circleId("circle-1"),
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const data = mapCircleToPersistence(circle);

    await prismaCircleRepository.save(circle);

    expect(mockedPrisma.circle.upsert).toHaveBeenCalledWith({
      where: { id: data.id },
      update: { name: data.name },
      create: data,
    });
  });

  test("delete は削除を呼ぶ", async () => {
    await prismaCircleRepository.delete(circleId("circle-1"));

    expect(mockedPrisma.circle.delete).toHaveBeenCalledWith({
      where: { id: "circle-1" },
    });
  });
});
