import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circle: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    circleMembership: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import type { Circle as PrismaCircle } from "@/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";
import { circleId, userId } from "@/server/domain/common/ids";
import { createCircle } from "@/server/domain/models/circle/circle";
import { prisma } from "@/server/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";
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

  test("findByIds は入力順に Circle を返す", async () => {
    const prismaCircles = [
      {
        id: "circle-2",
        name: "Circle B",
        createdAt: new Date("2024-01-02T00:00:00Z"),
      },
      {
        id: "circle-1",
        name: "Circle A",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    ] as PrismaCircle[];

    mockedPrisma.circle.findMany.mockResolvedValueOnce(prismaCircles);

    const circles = await prismaCircleRepository.findByIds([
      circleId("circle-1"),
      circleId("circle-2"),
    ]);

    expect(mockedPrisma.circle.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["circle-1", "circle-2"] } },
    });
    expect(circles.map((circle) => circle.id)).toEqual([
      circleId("circle-1"),
      circleId("circle-2"),
    ]);
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
      update: {
        name: data.name,
        sessionEmailNotificationEnabled: data.sessionEmailNotificationEnabled,
      },
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

describe("Prisma Circle メンバーシップリポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listMembershipsByCircleId はメンバー一覧を返す", async () => {
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

    const result = await prismaCircleRepository.listMembershipsByCircleId(
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

  test("listMembershipsByUserId はメンバーシップを返す", async () => {
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

    const result = await prismaCircleRepository.listMembershipsByUserId(
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
    await prismaCircleRepository.addMembership(
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

  test("addMembership は P2002（userId+circleId 一意制約違反）で ConflictError をスローする", async () => {
    mockedPrisma.circleMembership.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "0.0.0",
        meta: { target: ["userId", "circleId"] },
      }),
    );

    await expect(
      prismaCircleRepository.addMembership(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow(ConflictError);
  });

  test("addMembership は P2002 で target が期待と異なる場合そのまま再スローする", async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "0.0.0",
        meta: { target: ["other_field"] },
      },
    );
    mockedPrisma.circleMembership.create.mockRejectedValueOnce(error);

    await expect(
      prismaCircleRepository.addMembership(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow(error);
  });

  test("addMembership は P2002 以外の Prisma エラーはそのまま伝播する", async () => {
    const otherError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "0.0.0" },
    );
    mockedPrisma.circleMembership.create.mockRejectedValueOnce(otherError);

    await expect(
      prismaCircleRepository.addMembership(
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

    await prismaCircleRepository.updateMembershipRole(
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
      prismaCircleRepository.updateMembershipRole(
        circleId("circle-1"),
        userId("user-1"),
        "CircleMember",
      ),
    ).rejects.toThrow("CircleMembership not found");
  });

  test("論理削除後の再参加で create が呼ばれる", async () => {
    // 1. removeMembership で論理削除
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleRepository.removeMembership(
      circleId("circle-1"),
      userId("user-1"),
      deletedAt,
    );

    expect(mockedPrisma.circleMembership.updateMany).toHaveBeenCalledWith({
      where: {
        circleId: "circle-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt },
    });

    // 2. addMembership で再参加（新レコード作成）
    await prismaCircleRepository.addMembership(
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

  test("再参加後に listMembershipsByCircleId はアクティブなメンバーのみ返す", async () => {
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

    const result = await prismaCircleRepository.listMembershipsByCircleId(
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
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleRepository.removeMembership(
        circleId("circle-1"),
        userId("user-1"),
        deletedAt,
      ),
    ).rejects.toThrow("CircleMembership not found");
  });

  test("再参加後に listMembershipsByUserId がアクティブなメンバーシップのみ返す", async () => {
    mockedPrisma.circleMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-3",
        userId: "user-1",
        circleId: "circle-1",
        role: "CircleMember",
        createdAt: new Date("2025-06-02T00:00:00Z"),
        deletedAt: null,
      },
    ]);

    const result = await prismaCircleRepository.listMembershipsByUserId(
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
        role: "CircleMember",
        createdAt: new Date("2025-06-02T00:00:00Z"),
        deletedAt: null,
      },
    ]);
  });

  test("再参加時のロールが正しく設定される", async () => {
    // 論理削除後に CircleMember ロールで再参加
    await prismaCircleRepository.addMembership(
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

  test("論理削除済みメンバーへの removeMembership が NotFoundError をスローする", async () => {
    // deletedAt: null のレコードが存在しないため count: 0
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleRepository.removeMembership(
        circleId("circle-1"),
        userId("user-1"),
        new Date("2025-07-01T00:00:00Z"),
      ),
    ).rejects.toThrow(NotFoundError);
  });

  test("論理削除済みメンバーの deletedAt が後続の removeMembership で上書きされない", async () => {
    const firstDeletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleRepository.removeMembership(
      circleId("circle-1"),
      userId("user-1"),
      firstDeletedAt,
    );

    // 2回目の削除は deletedAt: null のレコードが存在しないため count: 0
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleRepository.removeMembership(
        circleId("circle-1"),
        userId("user-1"),
        new Date("2025-07-01T00:00:00Z"),
      ),
    ).rejects.toThrow(NotFoundError);

    // updateMany は where: { deletedAt: null } で呼ばれるため、
    // 既に論理削除済みのレコードの deletedAt は上書きされない
    expect(mockedPrisma.circleMembership.updateMany).toHaveBeenLastCalledWith({
      where: {
        circleId: "circle-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt: new Date("2025-07-01T00:00:00Z") },
    });
  });

  test("removeMembership は研究会メンバーシップを論理削除する", async () => {
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleRepository.removeMembership(
      circleId("circle-1"),
      userId("user-1"),
      deletedAt,
    );

    expect(mockedPrisma.circleMembership.updateMany).toHaveBeenCalledWith({
      where: {
        circleId: "circle-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt },
    });
  });
});
