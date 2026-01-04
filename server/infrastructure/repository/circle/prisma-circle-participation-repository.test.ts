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

  test("listParticipants は参加者一覧を返す", async () => {
    mockedPrisma.circleMembership.findMany.mockResolvedValueOnce([
      { userId: "user-1", role: "CircleOwner" },
      { userId: "user-2", role: "CircleMember" },
    ]);

    const result = await prismaCircleParticipationRepository.listParticipants(
      circleId("circle-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { circleId: "circle-1" },
      select: { userId: true, role: true },
    });
    expect(result).toEqual([
      { userId: userId("user-1"), role: "CircleOwner" },
      { userId: userId("user-2"), role: "CircleMember" },
    ]);
  });

  test("addParticipant は参加者を追加する", async () => {
    await prismaCircleParticipationRepository.addParticipant(
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

  test("updateParticipantRole は参加者のロールを更新する", async () => {
    await prismaCircleParticipationRepository.updateParticipantRole(
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

  test("removeParticipant は参加者を削除する", async () => {
    await prismaCircleParticipationRepository.removeParticipant(
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
