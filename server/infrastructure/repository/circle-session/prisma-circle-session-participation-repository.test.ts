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
import { circleSessionId, userId } from "@/server/domain/common/ids";
import { prismaCircleSessionParticipationRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-participation-repository";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma CircleSession 参加者リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("areParticipants は全員参加なら true", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(2);

    const result =
      await prismaCircleSessionParticipationRepository.areParticipants(
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

  test("areParticipants は一部不参加なら false", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result =
      await prismaCircleSessionParticipationRepository.areParticipants(
        circleSessionId("session-1"),
        [userId("user-1"), userId("user-2")],
      );

    expect(result).toBe(false);
  });

  test("areParticipants は空配列で false", async () => {
    const result =
      await prismaCircleSessionParticipationRepository.areParticipants(
        circleSessionId("session-1"),
        [],
      );

    expect(result).toBe(false);
    expect(mockedPrisma.circleSessionMembership.count).not.toHaveBeenCalled();
  });

  test("areParticipants は重複したユーザーを排除する", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result =
      await prismaCircleSessionParticipationRepository.areParticipants(
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

  test("listParticipants は参加者一覧を返す", async () => {
    mockedPrisma.circleSessionMembership.findMany.mockResolvedValueOnce([
      { userId: "user-1", role: "CircleSessionOwner" },
      { userId: "user-2", role: "CircleSessionMember" },
    ]);

    const result =
      await prismaCircleSessionParticipationRepository.listParticipants(
        circleSessionId("session-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { circleSessionId: "session-1" },
      select: { userId: true, role: true },
    });
    expect(result).toEqual([
      { userId: userId("user-1"), role: "CircleSessionOwner" },
      { userId: userId("user-2"), role: "CircleSessionMember" },
    ]);
  });

  test("addParticipant は参加者を追加する", async () => {
    await prismaCircleSessionParticipationRepository.addParticipant(
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

  test("updateParticipantRole は参加者のロールを更新する", async () => {
    await prismaCircleSessionParticipationRepository.updateParticipantRole(
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

  test("removeParticipant は参加者を削除する", async () => {
    await prismaCircleSessionParticipationRepository.removeParticipant(
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
});
