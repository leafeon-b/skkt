import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/infrastructure/db", () => ({
  prisma: {
    circleSession: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import type { CircleSession as PrismaCircleSession } from "@/generated/prisma/client";
import { prisma } from "@/server/infrastructure/db";
import { circleId, circleSessionId } from "@/server/domain/common/ids";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import { prismaCircleSessionRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-repository";
import { mapCircleSessionToPersistence } from "@/server/infrastructure/mappers/circle-session-mapper";

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

  test("listByCircleId は開催回一覧を返す", async () => {
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
