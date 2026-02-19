import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circleMembership: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { circleId, userId } from "@/server/domain/common/ids";
import { prisma } from "@/server/infrastructure/db";
import { prismaCircleParticipationRepository } from "@/server/infrastructure/repository/circle/prisma-circle-participation-repository";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma Circle 参加者リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listByCircleId は参加者一覧を返す", async () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    mockedPrisma.circleMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleId: "circle-1",
        role: "CircleOwner",
        createdAt,
        deletedAt: null,
      },
      {
        id: "membership-2",
        userId: "user-2",
        circleId: "circle-1",
        role: "CircleMember",
        createdAt: new Date("2025-01-02T00:00:00Z"),
        deletedAt: null,
      },
    ]);

    const result = await prismaCircleParticipationRepository.listByCircleId(
      circleId("circle-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { circleId: "circle-1" },
      select: { circleId: true, userId: true, role: true, createdAt: true },
    });
    expect(result).toEqual([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt,
      },
      {
        circleId: circleId("circle-1"),
        userId: userId("user-2"),
        role: "CircleMember",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);
  });

  test("listByUserId は参加関係を返す", async () => {
    const createdAt = new Date("2025-02-01T00:00:00Z");
    mockedPrisma.circleMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleId: "circle-1",
        role: "CircleOwner",
        createdAt,
        deletedAt: null,
      },
      {
        id: "membership-2",
        userId: "user-1",
        circleId: "circle-2",
        role: "CircleMember",
        createdAt: new Date("2025-02-02T00:00:00Z"),
        deletedAt: null,
      },
    ]);

    const result = await prismaCircleParticipationRepository.listByUserId(
      userId("user-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      select: { circleId: true, userId: true, role: true, createdAt: true },
    });
    expect(result).toEqual([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt,
      },
      {
        circleId: circleId("circle-2"),
        userId: userId("user-1"),
        role: "CircleMember",
        createdAt: new Date("2025-02-02T00:00:00Z"),
      },
    ]);
  });

  test("addParticipation は参加者を追加する", async () => {
    await prismaCircleParticipationRepository.addParticipation(
      circleId("circle-1"),
      userId("user-1"),
      "CircleManager",
    );

    expect(mockedPrisma.circleMembership.create).toHaveBeenCalledWith({
      data: {
        circleId: "circle-1",
        userId: "user-1",
        role: "CircleManager",
      },
    });
  });

  test("updateParticipationRole は参加者のロールを更新する", async () => {
    mockedPrisma.circleMembership.findFirst.mockResolvedValueOnce({
      id: "membership-1",
      userId: "user-1",
      circleId: "circle-1",
      role: "CircleOwner",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      deletedAt: null,
    });

    await prismaCircleParticipationRepository.updateParticipationRole(
      circleId("circle-1"),
      userId("user-1"),
      "CircleMember",
    );

    expect(mockedPrisma.circleMembership.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        circleId: "circle-1",
        deletedAt: null,
      },
    });
    expect(mockedPrisma.circleMembership.update).toHaveBeenCalledWith({
      where: { id: "membership-1" },
      data: { role: "CircleMember" },
    });
  });

  test("updateParticipationRole はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleMembership.findFirst.mockResolvedValueOnce(null);

    await expect(
      prismaCircleParticipationRepository.updateParticipationRole(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow("CircleMembership not found");
  });

  test("removeParticipation は研究会メンバーシップのみを削除する", async () => {
    await prismaCircleParticipationRepository.removeParticipation(
      circleId("circle-1"),
      userId("user-1"),
    );

    expect(mockedPrisma.circleMembership.deleteMany).toHaveBeenCalledWith({
      where: {
        circleId: "circle-1",
        userId: "user-1",
      },
    });
  });
});
