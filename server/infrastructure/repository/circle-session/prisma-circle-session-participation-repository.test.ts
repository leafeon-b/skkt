import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circleSessionMembership: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/infrastructure/db";
import { circleSessionId, userId } from "@/server/domain/common/ids";
import { prismaCircleSessionParticipationRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-participation-repository";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma CircleSession 参加者リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("areUsersParticipating は全員参加なら true", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(2);

    const result =
      await prismaCircleSessionParticipationRepository.areUsersParticipating(
        circleSessionId("session-1"),
        [userId("user-1"), userId("user-2")],
      );

    expect(mockedPrisma.circleSessionMembership.count).toHaveBeenCalledWith({
      where: {
        circleSessionId: "session-1",
        userId: { in: ["user-1", "user-2"] },
        deletedAt: null,
      },
    });
    expect(result).toBe(true);
  });

  test("areUsersParticipating は一部不参加なら false", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result =
      await prismaCircleSessionParticipationRepository.areUsersParticipating(
        circleSessionId("session-1"),
        [userId("user-1"), userId("user-2")],
      );

    expect(result).toBe(false);
  });

  test("areUsersParticipating は空配列で false", async () => {
    const result =
      await prismaCircleSessionParticipationRepository.areUsersParticipating(
        circleSessionId("session-1"),
        [],
      );

    expect(result).toBe(false);
    expect(mockedPrisma.circleSessionMembership.count).not.toHaveBeenCalled();
  });

  test("areUsersParticipating は重複したユーザーを排除する", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result =
      await prismaCircleSessionParticipationRepository.areUsersParticipating(
        circleSessionId("session-1"),
        [userId("user-1"), userId("user-1")],
      );

    expect(mockedPrisma.circleSessionMembership.count).toHaveBeenCalledWith({
      where: {
        circleSessionId: "session-1",
        userId: { in: ["user-1"] },
        deletedAt: null,
      },
    });
    expect(result).toBe(true);
  });

  test("listParticipations は参加者一覧を返す", async () => {
    const createdAt1 = new Date("2025-01-01T00:00:00Z");
    const createdAt2 = new Date("2025-01-02T00:00:00Z");
    mockedPrisma.circleSessionMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleSessionId: "session-1",
        role: "CircleSessionOwner",
        createdAt: createdAt1,
        deletedAt: null,
      },
      {
        id: "membership-2",
        userId: "user-2",
        circleSessionId: "session-1",
        role: "CircleSessionMember",
        createdAt: createdAt2,
        deletedAt: null,
      },
    ]);

    const result =
      await prismaCircleSessionParticipationRepository.listParticipations(
        circleSessionId("session-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { circleSessionId: "session-1", deletedAt: null },
      select: { circleSessionId: true, userId: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(result).toEqual([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
        createdAt: createdAt1,
        deletedAt: null,
      },
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-2"),
        role: "CircleSessionMember",
        createdAt: createdAt2,
        deletedAt: null,
      },
    ]);
  });

  test("listByUserId は参加関係を返す", async () => {
    const createdAt1 = new Date("2025-01-01T00:00:00Z");
    const createdAt2 = new Date("2025-01-02T00:00:00Z");
    mockedPrisma.circleSessionMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleSessionId: "session-1",
        role: "CircleSessionOwner",
        createdAt: createdAt1,
        deletedAt: null,
      },
      {
        id: "membership-2",
        userId: "user-1",
        circleSessionId: "session-2",
        role: "CircleSessionMember",
        createdAt: createdAt2,
        deletedAt: null,
      },
    ]);

    const result =
      await prismaCircleSessionParticipationRepository.listByUserId(
        userId("user-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", deletedAt: null },
      select: { circleSessionId: true, userId: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(result).toEqual([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
        createdAt: createdAt1,
        deletedAt: null,
      },
      {
        circleSessionId: circleSessionId("session-2"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
        createdAt: createdAt2,
        deletedAt: null,
      },
    ]);
  });

  test("addParticipation は参加者を追加する", async () => {
    await prismaCircleSessionParticipationRepository.addParticipation(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionMember",
    );

    expect(mockedPrisma.circleSessionMembership.create).toHaveBeenCalledWith({
      data: {
        circleSessionId: "session-1",
        userId: "user-1",
        role: "CircleSessionMember",
      },
    });
  });

  test("updateParticipationRole は参加者のロールを更新する", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({ count: 1 });

    await prismaCircleSessionParticipationRepository.updateParticipationRole(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionManager",
    );

    expect(mockedPrisma.circleSessionMembership.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        circleSessionId: "session-1",
        deletedAt: null,
      },
      data: { role: "CircleSessionManager" },
    });
  });

  test("updateParticipationRole はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      prismaCircleSessionParticipationRepository.updateParticipationRole(
        circleSessionId("session-1"),
        userId("user-1"),
        "CircleSessionManager",
      ),
    ).rejects.toThrow("CircleSessionMembership not found");
  });

  test("論理削除後の再参加で create が呼ばれる", async () => {
    // 1. removeParticipation で論理削除
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({ count: 1 });
    await prismaCircleSessionParticipationRepository.removeParticipation(
      circleSessionId("session-1"),
      userId("user-1"),
    );

    expect(
      mockedPrisma.circleSessionMembership.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        circleSessionId: "session-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });

    // 2. addParticipation で再参加（新レコード作成）
    await prismaCircleSessionParticipationRepository.addParticipation(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionMember",
    );

    expect(mockedPrisma.circleSessionMembership.create).toHaveBeenCalledWith({
      data: {
        circleSessionId: "session-1",
        userId: "user-1",
        role: "CircleSessionMember",
      },
    });
  });

  test("再参加後に listParticipations はアクティブなメンバーのみ返す", async () => {
    // 論理削除済みレコードと新規アクティブレコードが共存する想定
    // findMany は deletedAt: null でフィルタするため、アクティブのみ返る
    mockedPrisma.circleSessionMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-3",
        userId: "user-1",
        circleSessionId: "session-1",
        role: "CircleSessionMember",
        createdAt: new Date("2025-06-01T00:00:00Z"),
        deletedAt: null,
      },
    ]);

    const result =
      await prismaCircleSessionParticipationRepository.listParticipations(
        circleSessionId("session-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { circleSessionId: "session-1", deletedAt: null },
      select: { circleSessionId: true, userId: true, role: true, createdAt: true, deletedAt: true },
    });
    // 論理削除済みの旧レコードは含まれず、再参加後のアクティブレコードのみ
    expect(result).toEqual([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
        createdAt: new Date("2025-06-01T00:00:00Z"),
        deletedAt: null,
      },
    ]);
  });

  test("removeParticipation はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      prismaCircleSessionParticipationRepository.removeParticipation(
        circleSessionId("session-1"),
        userId("user-1"),
      ),
    ).rejects.toThrow("CircleSessionMembership not found");
  });

  test("removeParticipation は参加者を論理削除する", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({ count: 1 });
    await prismaCircleSessionParticipationRepository.removeParticipation(
      circleSessionId("session-1"),
      userId("user-1"),
    );

    expect(
      mockedPrisma.circleSessionMembership.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        circleSessionId: "session-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });
  });

});
