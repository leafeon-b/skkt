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

import { ConflictError } from "@/server/domain/common/errors";
import { circleId, userId } from "@/server/domain/common/ids";
import { prisma } from "@/server/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";
import { prismaCircleMembershipRepository } from "@/server/infrastructure/repository/circle/prisma-circle-membership-repository";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma Circle メンバーシップリポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listByCircleId はメンバー一覧を返す", async () => {
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

    const result = await prismaCircleMembershipRepository.listByCircleId(
      circleId("circle-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { circleId: "circle-1", deletedAt: null },
      select: {
        circleId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
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

  test("listByUserId はメンバーシップを返す", async () => {
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

    const result = await prismaCircleMembershipRepository.listByUserId(
      userId("user-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        circleId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
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

  test("addMembership はメンバーを追加する", async () => {
    await prismaCircleMembershipRepository.addMembership(
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

  test("addMembership は P2002（一意制約違反）で ConflictError をスローする", async () => {
    mockedPrisma.circleMembership.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "0.0.0",
      }),
    );

    await expect(
      prismaCircleMembershipRepository.addMembership(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow(ConflictError);
  });

  test("addMembership は P2002 以外の Prisma エラーはそのまま伝播する", async () => {
    const otherError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "0.0.0" },
    );
    mockedPrisma.circleMembership.create.mockRejectedValueOnce(otherError);

    await expect(
      prismaCircleMembershipRepository.addMembership(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow(otherError);
  });

  test("updateMembershipRole はメンバーのロールを更新する", async () => {
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });

    await prismaCircleMembershipRepository.updateMembershipRole(
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

  test("updateMembershipRole はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleMembershipRepository.updateMembershipRole(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow("CircleMembership not found");
  });

  test("論理削除後の再参加で create が呼ばれる", async () => {
    // 1. removeMembership で論理削除
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleMembershipRepository.removeMembership(
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

    // 2. addMembership で再参加（新レコード作成）
    await prismaCircleMembershipRepository.addMembership(
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

    const result = await prismaCircleMembershipRepository.listByCircleId(
      circleId("circle-1"),
    );

    expect(mockedPrisma.circleMembership.findMany).toHaveBeenCalledWith({
      where: { circleId: "circle-1", deletedAt: null },
      select: {
        circleId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });
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

  test("removeMembership はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleMembershipRepository.removeMembership(
        circleId("circle-1"),
        userId("user-1"),
      ),
    ).rejects.toThrow("CircleMembership not found");
  });

  test("removeMembership は研究会メンバーシップを論理削除する", async () => {
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleMembershipRepository.removeMembership(
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
