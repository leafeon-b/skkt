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
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";
import { toCircleId, toCircleSessionId, toUserId } from "@/server/domain/common/ids";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import { prisma } from "@/server/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";
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
      toCircleSessionId("session-1"),
    );

    expect(session?.id).toBe("session-1");
  });

  test("findById は未取得時に null を返す", async () => {
    mockedPrisma.circleSession.findUnique.mockResolvedValueOnce(null);

    const session = await prismaCircleSessionRepository.findById(
      toCircleSessionId("session-1"),
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
      toCircleSessionId("session-1"),
      toCircleSessionId("session-2"),
    ]);

    expect(sessions.map((session) => session.id)).toEqual([
      toCircleSessionId("session-1"),
      toCircleSessionId("session-2"),
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
      toCircleId("circle-1"),
    );

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
      toCircleId("circle-1"),
    );

    expect(sessions.map((session) => session.id)).toEqual([
      toCircleSessionId("session-a"),
      toCircleSessionId("session-b"),
      toCircleSessionId("session-c"),
    ]);
  });

  test("save はエラーなく完了する", async () => {
    const session = createCircleSession({
      id: toCircleSessionId("session-1"),
      circleId: toCircleId("circle-1"),

      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: "A",
      note: "メモ",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    await expect(
      prismaCircleSessionRepository.save(session),
    ).resolves.toBeUndefined();
  });

  test("delete はエラーなく完了する", async () => {
    await expect(
      prismaCircleSessionRepository.delete(toCircleSessionId("session-1")),
    ).resolves.toBeUndefined();
  });
});

describe("Prisma CircleSession メンバーシップリポジトリ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("areUsersSessionMembers は全員参加なら true", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(2);

    const result = await prismaCircleSessionRepository.areUsersSessionMembers(
      toCircleSessionId("session-1"),
      [toUserId("user-1"), toUserId("user-2")],
    );

    expect(result).toBe(true);
  });

  test("areUsersSessionMembers は一部不参加なら false", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result = await prismaCircleSessionRepository.areUsersSessionMembers(
      toCircleSessionId("session-1"),
      [toUserId("user-1"), toUserId("user-2")],
    );

    expect(result).toBe(false);
  });

  test("areUsersSessionMembers は空配列で false", async () => {
    const result = await prismaCircleSessionRepository.areUsersSessionMembers(
      toCircleSessionId("session-1"),
      [],
    );

    expect(result).toBe(false);
    expect(mockedPrisma.circleSessionMembership.count).not.toHaveBeenCalled();
  });

  test("areUsersSessionMembers は重複したユーザーを排除する", async () => {
    mockedPrisma.circleSessionMembership.count.mockResolvedValueOnce(1);

    const result = await prismaCircleSessionRepository.areUsersSessionMembers(
      toCircleSessionId("session-1"),
      [toUserId("user-1"), toUserId("user-1")],
    );

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

    const result = await prismaCircleSessionRepository.listMemberships(
      toCircleSessionId("session-1"),
    );

    expect(result).toEqual([
      {
        circleSessionId: toCircleSessionId("session-1"),
        userId: toUserId("user-1"),
        role: "CircleSessionOwner",
        createdAt: createdAt1,
        deletedAt: null,
      },
      {
        circleSessionId: toCircleSessionId("session-1"),
        userId: toUserId("user-2"),
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

    const result = await prismaCircleSessionRepository.listMembershipsByUserId(
      toUserId("user-1"),
    );

    expect(result).toEqual([
      {
        circleSessionId: toCircleSessionId("session-1"),
        userId: toUserId("user-1"),
        role: "CircleSessionOwner",
        createdAt: createdAt1,
        deletedAt: null,
      },
      {
        circleSessionId: toCircleSessionId("session-2"),
        userId: toUserId("user-1"),
        role: "CircleSessionMember",
        createdAt: createdAt2,
        deletedAt: null,
      },
    ]);
  });

  test("addMembership はエラーなく完了する", async () => {
    await expect(
      prismaCircleSessionRepository.addMembership(
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        "CircleSessionMember",
      ),
    ).resolves.toBeUndefined();
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
        toCircleSessionId("session-1"),
        toUserId("user-1"),
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
        toCircleSessionId("session-1"),
        toUserId("user-1"),
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
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        "CircleSessionMember",
      ),
    ).rejects.toThrow(otherError);
  });

  test("updateMembershipRole はエラーなく完了する", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });

    await expect(
      prismaCircleSessionRepository.updateMembershipRole(
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        "CircleSessionManager",
      ),
    ).resolves.toBeUndefined();
  });

  test("updateMembershipRole はレコードが見つからない場合エラーをスローする", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleSessionRepository.updateMembershipRole(
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        "CircleSessionManager",
      ),
    ).rejects.toThrow("CircleSessionMembership not found");
  });

  test("論理削除後の再参加がエラーなく完了する", async () => {
    // 1. removeMembership で論理削除
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleSessionRepository.removeMembership(
      toCircleSessionId("session-1"),
      toUserId("user-1"),
      deletedAt,
    );

    // 2. addMembership で再参加（新レコード作成）
    await expect(
      prismaCircleSessionRepository.addMembership(
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        "CircleSessionMember",
      ),
    ).resolves.toBeUndefined();
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

    const result = await prismaCircleSessionRepository.listMemberships(
      toCircleSessionId("session-1"),
    );

    expect(result).toEqual([
      {
        circleSessionId: toCircleSessionId("session-1"),
        userId: toUserId("user-1"),
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
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        deletedAt,
      ),
    ).rejects.toThrow("CircleSessionMembership not found");
  });

  test("再参加後に listMembershipsByUserId がアクティブなメンバーシップのみ返す", async () => {
    mockedPrisma.circleSessionMembership.findMany.mockResolvedValueOnce([
      {
        id: "membership-3",
        userId: "user-1",
        circleSessionId: "session-1",
        role: "CircleSessionMember",
        createdAt: new Date("2025-06-02T00:00:00Z"),
        deletedAt: null,
      },
    ]);

    const result = await prismaCircleSessionRepository.listMembershipsByUserId(
      toUserId("user-1"),
    );

    expect(result).toEqual([
      {
        circleSessionId: toCircleSessionId("session-1"),
        userId: toUserId("user-1"),
        role: "CircleSessionMember",
        createdAt: new Date("2025-06-02T00:00:00Z"),
        deletedAt: null,
      },
    ]);
  });

  test("論理削除済みメンバーへの removeMembership が NotFoundError をスローする", async () => {
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleSessionRepository.removeMembership(
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        new Date("2025-07-01T00:00:00Z"),
      ),
    ).rejects.toThrow(NotFoundError);
  });

  test("論理削除済みメンバーの deletedAt が後続の removeMembership で上書きされない", async () => {
    const firstDeletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    await prismaCircleSessionRepository.removeMembership(
      toCircleSessionId("session-1"),
      toUserId("user-1"),
      firstDeletedAt,
    );

    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      prismaCircleSessionRepository.removeMembership(
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        new Date("2025-07-01T00:00:00Z"),
      ),
    ).rejects.toThrow(NotFoundError);
  });

  test("removeMembership はメンバーシップを論理削除する", async () => {
    const deletedAt = new Date("2025-06-01T00:00:00Z");
    mockedPrisma.circleSessionMembership.updateMany.mockResolvedValueOnce({
      count: 1,
    });

    await expect(
      prismaCircleSessionRepository.removeMembership(
        toCircleSessionId("session-1"),
        toUserId("user-1"),
        deletedAt,
      ),
    ).resolves.toBeUndefined();
  });
});
