import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circleSessionMembership: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/infrastructure/db";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";
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
      },
    });
    expect(result).toBe(true);
  });

  test("listParticipations は参加者一覧を返す", async () => {
    mockedPrisma.circleSessionMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleSessionId: "session-1",
        role: "CircleSessionOwner",
        deletedAt: null,
      },
      {
        id: "membership-2",
        userId: "user-2",
        circleSessionId: "session-1",
        role: "CircleSessionMember",
        deletedAt: null,
      },
    ]);

    const result =
      await prismaCircleSessionParticipationRepository.listParticipations(
        circleSessionId("session-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { circleSessionId: "session-1" },
      select: { circleSessionId: true, userId: true, role: true },
    });
    expect(result).toEqual([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-2"),
        role: "CircleSessionMember",
      },
    ]);
  });

  test("listByUserId は参加関係を返す", async () => {
    mockedPrisma.circleSessionMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-1",
        userId: "user-1",
        circleSessionId: "session-1",
        role: "CircleSessionOwner",
        deletedAt: null,
      },
      {
        id: "membership-2",
        userId: "user-1",
        circleSessionId: "session-2",
        role: "CircleSessionMember",
        deletedAt: null,
      },
    ]);

    const result =
      await prismaCircleSessionParticipationRepository.listByUserId(
        userId("user-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { circleSessionId: true, userId: true, role: true },
    });
    expect(result).toEqual([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
      {
        circleSessionId: circleSessionId("session-2"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
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
    await prismaCircleSessionParticipationRepository.updateParticipationRole(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionManager",
    );

    expect(mockedPrisma.circleSessionMembership.update).toHaveBeenCalledWith({
      where: {
        userId_circleSessionId: {
          userId: "user-1",
          circleSessionId: "session-1",
        },
      },
      data: {
        role: "CircleSessionManager",
      },
    });
  });

  test("removeParticipation は参加者を削除する", async () => {
    await prismaCircleSessionParticipationRepository.removeParticipation(
      circleSessionId("session-1"),
      userId("user-1"),
    );

    expect(
      mockedPrisma.circleSessionMembership.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        circleSessionId: "session-1",
        userId: "user-1",
      },
    });
  });

  test("removeAllByCircleAndUser は指定された研究会とユーザーに紐づく全セッション参加情報を削除する", async () => {
    await prismaCircleSessionParticipationRepository.removeAllByCircleAndUser(
      circleId("circle-1"),
      userId("user-1"),
    );

    expect(
      mockedPrisma.circleSessionMembership.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        session: { circleId: "circle-1" },
      },
    });
  });
});
