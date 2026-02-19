import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circleMembership: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
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
      where: { circleId: "circle-1", deletedAt: null },
      select: { circleId: true, userId: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(result).toEqual([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt,
        deletedAt: null,
      },
      {
        circleId: circleId("circle-1"),
        userId: userId("user-2"),
        role: "CircleMember",
        createdAt: new Date("2025-01-02T00:00:00Z"),
        deletedAt: null,
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
      where: { userId: "user-1", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { circleId: true, userId: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(result).toEqual([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt,
        deletedAt: null,
      },
      {
        circleId: circleId("circle-2"),
        userId: userId("user-1"),
        role: "CircleMember",
        createdAt: new Date("2025-02-02T00:00:00Z"),
        deletedAt: null,
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
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({ count: 1 });

    await prismaCircleParticipationRepository.updateParticipationRole(
      circleId("circle-1"),
      userId("user-1"),
      "CircleMember",
    );

    expect(mockedPrisma.circleMembership.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        circleId: "circle-1",
        deletedAt: null,
      },
      data: { role: "CircleMember" },
    });
  });

  test("updateParticipationRole はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      prismaCircleParticipationRepository.updateParticipationRole(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow("CircleMembership not found");
  });

  test("論理削除後の再参加で create が呼ばれる", async () => {
    // 1. removeParticipation で論理削除
    await prismaCircleParticipationRepository.removeParticipation(
      circleId("circle-1"),
      userId("user-1"),
    );

    expect(mockedPrisma.circleMembership.updateMany).toHaveBeenCalledWith({
      where: {
        circleId: "circle-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });

    // 2. addParticipation で再参加（新レコード作成）
    await prismaCircleParticipationRepository.addParticipation(
      circleId("circle-1"),
      userId("user-1"),
      "CircleMember",
    );

    expect(mockedPrisma.circleMembership.create).toHaveBeenCalledWith({
      data: {
        circleId: "circle-1",
        userId: "user-1",
        role: "CircleMember",
      },
    });
  });

  test("再参加後に listByCircleId はアクティブなメンバーのみ返す", async () => {
    // 論理削除済みレコードと新規アクティブレコードが共存する想定
    // findMany は deletedAt: null でフィルタするため、アクティブのみ返る
    mockedPrisma.circleMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-3",
        userId: "user-1",
        circleId: "circle-1",
        role: "CircleMember",
        createdAt: new Date("2025-06-01T00:00:00Z"),
        deletedAt: null,
      },
    ]);

    const result = await prismaCircleParticipationRepository.listByCircleId(
      circleId("circle-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { circleId: "circle-1", deletedAt: null },
      select: { circleId: true, userId: true, role: true, createdAt: true, deletedAt: true },
    });
    // 論理削除済みの旧レコードは含まれず、再参加後のアクティブレコードのみ
    expect(result).toEqual([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
        createdAt: new Date("2025-06-01T00:00:00Z"),
        deletedAt: null,
      },
    ]);
  });

  test("removeParticipation は研究会メンバーシップを論理削除する", async () => {
    await prismaCircleParticipationRepository.removeParticipation(
      circleId("circle-1"),
      userId("user-1"),
    );

    expect(mockedPrisma.circleMembership.updateMany).toHaveBeenCalledWith({
      where: {
        circleId: "circle-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
