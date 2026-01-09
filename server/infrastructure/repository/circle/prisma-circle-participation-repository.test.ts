import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circleMembership: {
      findMany: vi.fn(),
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

  test("listParticipations は参加者一覧を返す", async () => {
    mockedPrisma.circleMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleId: "circle-1",
        role: "CircleOwner",
      },
      {
        id: "membership-2",
        userId: "user-2",
        circleId: "circle-1",
        role: "CircleMember",
      },
    ]);

    const result = await prismaCircleParticipationRepository.listParticipations(
      circleId("circle-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { circleId: "circle-1" },
      select: { circleId: true, userId: true, role: true },
    });
    expect(result).toEqual([
      { circleId: circleId("circle-1"), userId: userId("user-1"), role: "CircleOwner" },
      { circleId: circleId("circle-1"), userId: userId("user-2"), role: "CircleMember" },
    ]);
  });

  test("listByUserId は参加関係を返す", async () => {
    mockedPrisma.circleMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleId: "circle-1",
        role: "CircleOwner",
      },
      {
        id: "membership-2",
        userId: "user-1",
        circleId: "circle-2",
        role: "CircleMember",
      },
    ]);

    const result = await prismaCircleParticipationRepository.listByUserId(
      userId("user-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { circleId: true, userId: true, role: true },
    });
    expect(result).toEqual([
      { circleId: circleId("circle-1"), userId: userId("user-1"), role: "CircleOwner" },
      { circleId: circleId("circle-2"), userId: userId("user-1"), role: "CircleMember" },
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
    await prismaCircleParticipationRepository.updateParticipationRole(
      circleId("circle-1"),
      userId("user-1"),
      "CircleMember",
    );

    expect(mockedPrisma.circleMembership.update).toHaveBeenCalledWith({
      where: {
        userId_circleId: {
          userId: "user-1",
          circleId: "circle-1",
        },
      },
      data: {
        role: "CircleMember",
      },
    });
  });

  test("removeParticipation は参加者を削除する", async () => {
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
