import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circleSession: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    circleSessionMembership: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import type { CircleSession as PrismaCircleSession } from "@/generated/prisma/client";
import { ConflictError } from "@/server/domain/common/errors";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import { prisma } from "@/server/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";
import { mapCircleSessionToPersistence } from "@/server/infrastructure/mappers/circle-session-mapper";
import { prismaCircleSessionRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-repository";

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe("Prisma CircleSession リポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("findById は CircleSession を返す", async () => {
    const prismaSession = {
      id: "session-1",
      circleId: "circle-1",

      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: "A",
      note: "メモ",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    } as PrismaCircleSession;

    mockedPrisma.circleSession.findUnique.mockResolvedValueOnce(prismaSession);

    const session = await prismaCircleSessionRepository.findById(
      circleSessionId("session-1"),
    );

    expect(mockedPrisma.circleSession.findUnique).toHaveBeenCalledWith({
      where: { id: "session-1" },
    });
    expect(session?.id).toBe("session-1");
  });

  test("findById は未取得時に null を返す", async () => {
    mockedPrisma.circleSession.findUnique.mockResolvedValueOnce(null);

    const session = await prismaCircleSessionRepository.findById(
      circleSessionId("session-1"),
    );

    expect(session).toBeNull();
  });

  test("findByIds は入力順に CircleSession を返す", async () => {
    const prismaSessions = [
      {
        id: "session-2",
        circleId: "circle-1",

        title: "第2回 研究会",
        startsAt: new Date("2024-01-02T10:00:00Z"),
        endsAt: new Date("2024-01-02T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
      {
        id: "session-1",
        circleId: "circle-1",

        title: "第1回 研究会",
        startsAt: new Date("2024-01-01T10:00:00Z"),
        endsAt: new Date("2024-01-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    ] as PrismaCircleSession[];

    mockedPrisma.circleSession.findMany.mockResolvedValueOnce(prismaSessions);

    const sessions = await prismaCircleSessionRepository.findByIds([
      circleSessionId("session-1"),
      circleSessionId("session-2"),
    ]);

    expect(mockedPrisma.circleSession.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["session-1", "session-2"] } },
    });
    expect(sessions.map((session) => session.id)).toEqual([
      circleSessionId("session-1"),
      circleSessionId("session-2"),
    ]);
  });

  test("listByCircleId はセッション一覧を返す", async () => {
    const prismaSession = {
      id: "session-1",
      circleId: "circle-1",

      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: null,
      note: "",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    } as PrismaCircleSession;

    mockedPrisma.circleSession.findMany.mockResolvedValueOnce([prismaSession]);

    const sessions = await prismaCircleSessionRepository.listByCircleId(
      circleId("circle-1"),
    );

    expect(mockedPrisma.circleSession.findMany).toHaveBeenCalledWith({
      where: { circleId: "circle-1" },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
    });
    expect(sessions).toHaveLength(1);
  });

  test("listByCircleId はPrismaから返された順序をそのまま保持する", async () => {
    const prismaSessions = [
      {
        id: "session-a",
        circleId: "circle-1",
        title: "セッションA",
        startsAt: new Date("2024-01-01T10:00:00Z"),
        endsAt: new Date("2024-01-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2024-01-01T03:00:00Z"),
      },
      {
        id: "session-b",
        circleId: "circle-1",
        title: "セッションB",
        startsAt: new Date("2024-01-01T10:00:00Z"),
        endsAt: new Date("2024-01-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2024-01-01T01:00:00Z"),
      },
      {
        id: "session-c",
        circleId: "circle-1",
        title: "セッションC",
        startsAt: new Date("2024-01-01T10:00:00Z"),
        endsAt: new Date("2024-01-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2024-01-01T02:00:00Z"),
      },
    ] as PrismaCircleSession[];

    mockedPrisma.circleSession.findMany.mockResolvedValueOnce(prismaSessions);

    const sessions = await prismaCircleSessionRepository.listByCircleId(
      circleId("circle-1"),
    );

    expect(sessions.map((session) => session.id)).toEqual([
      circleSessionId("session-a"),
      circleSessionId("session-b"),
      circleSessionId("session-c"),
    ]);
  });

  test("save は upsert を呼ぶ", async () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),

      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: "A",
      note: "メモ",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const data = mapCircleSessionToPersistence(session);

    await prismaCircleSessionRepository.save(session);

    expect(mockedPrisma.circleSession.upsert).toHaveBeenCalledWith({
      where: { id: data.id },
      update: {
        title: data.title,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        location: data.location,
        note: data.note,
      },
      create: data,
    });
  });

  test("delete は削除を呼ぶ", async () => {
    await prismaCircleSessionRepository.delete(circleSessionId("session-1"));

    expect(mockedPrisma.circleSession.delete).toHaveBeenCalledWith({
      where: { id: "session-1" },
    });
  });
});

describe("Prisma CircleSession メンバーシップリポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("areUsersSessionMembers は全員参加なら true", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(2);

    const result =
      await prismaCircleSessionRepository.areUsersSessionMembers(
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

  test("areUsersSessionMembers は一部不参加なら false", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result =
      await prismaCircleSessionRepository.areUsersSessionMembers(
        circleSessionId("session-1"),
        [userId("user-1"), userId("user-2")],
      );

    expect(result).toBe(false);
  });

  test("areUsersSessionMembers は空配列で false", async () => {
    const result =
      await prismaCircleSessionRepository.areUsersSessionMembers(
        circleSessionId("session-1"),
        [],
      );

    expect(result).toBe(false);
    expect(mockedPrisma.circleSessionMembership.count).not.toHaveBeenCalled();
  });

  test("areUsersSessionMembers は重複したユーザーを排除する", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result =
      await prismaCircleSessionRepository.areUsersSessionMembers(
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

  test("listMemberships はメンバー一覧を返す", async () => {
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
      await prismaCircleSessionRepository.listMemberships(
        circleSessionId("session-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { circleSessionId: "session-1", deletedAt: null },
      select: {
        circleSessionId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
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

  test("listMembershipsByUserId はメンバーシップを返す", async () => {
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
      await prismaCircleSessionRepository.listMembershipsByUserId(
        userId("user-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", deletedAt: null },
      select: {
        circleSessionId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
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

  test("addMembership はメンバーを追加する", async () => {
    await prismaCircleSessionRepository.addMembership(
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

  test("addMembership は P2002（userId+circleSessionId 一意制約違反）で ConflictError をスローする", async () => {
    mockedPrisma.circleSessionMembership.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "0.0.0",
        meta: { target: ["userId", "circleSessionId"] },
      }),
    );

    await expect(
      prismaCircleSessionRepository.addMembership(
        circleSessionId("session-1"),
        userId("user-1"),
        "CircleSessionMember",
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
    mockedPrisma.circleSessionMembership.create.mockRejectedValueOnce(error);

    await expect(
      prismaCircleSessionRepository.addMembership(
        circleSessionId("session-1"),
        userId("user-1"),
        "CircleSessionMember",
      ),
    ).rejects.toThrow(error);
  });

  test("addMembership は P2002 以外の Prisma エラーはそのまま伝播する", async () => {
    const otherError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "0.0.0" },
    );
    mockedPrisma.circleSessionMembership.create.mockRejectedValueOnce(
      otherError,
    );

    await expect(
      prismaCircleSessionRepository.addMembership(
        circleSessionId("session-1"),
        userId("user-1"),
        "CircleSessionMember",
      ),
    ).rejects.toThrow(otherError);
  });

  test("updateMembershipRole はメンバーのロールを更新する", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });

    await prismaCircleSessionRepository.updateMembershipRole(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionManager",
    );

    expect(
      mockedPrisma.circleSessionMembership.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        circleSessionId: "session-1",
        deletedAt: null,
      },
      data: { role: "CircleSessionManager" },
    });
  });

  test("updateMembershipRole はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleSessionRepository.updateMembershipRole(
        circleSessionId("session-1"),
        userId("user-1"),
        "CircleSessionManager",
      ),
    ).rejects.toThrow("CircleSessionMembership not found");
  });

  test("論理削除後の再参加で create が呼ばれる", async () => {
    // 1. removeMembership で論理削除
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleSessionRepository.removeMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      deletedAt,
    );

    expect(
      mockedPrisma.circleSessionMembership.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        circleSessionId: "session-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt },
    });

    // 2. addMembership で再参加（新レコード作成）
    await prismaCircleSessionRepository.addMembership(
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

  test("再参加後に listMemberships はアクティブなメンバーのみ返す", async () => {
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
      await prismaCircleSessionRepository.listMemberships(
        circleSessionId("session-1"),
      );

    expect(mockedPrisma.circleSessionMembership.findMany).toHaveBeenCalledWith({
      where: { circleSessionId: "session-1", deletedAt: null },
      select: {
        circleSessionId: true,
        userId: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    });
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

  test("removeMembership はレコードが見つからない場合エラーをスローする", async () => {
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleSessionRepository.removeMembership(
        circleSessionId("session-1"),
        userId("user-1"),
        deletedAt,
      ),
    ).rejects.toThrow("CircleSessionMembership not found");
  });

  test("removeMembership はメンバーシップを論理削除する", async () => {
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleSessionRepository.removeMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      deletedAt,
    );

    expect(
      mockedPrisma.circleSessionMembership.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        circleSessionId: "session-1",
        userId: "user-1",
        deletedAt: null,
      },
      data: { deletedAt },
    });
  });
});
