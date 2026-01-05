import { describe, expect, test } from "vitest";
import type { CircleSession as PrismaCircleSession } from "@/generated/prisma/client";
import {
  mapCircleSessionToDomain,
  mapCircleSessionToPersistence,
} from "@/server/infrastructure/mappers/circle-session-mapper";
import { circleId, circleSessionId } from "@/server/domain/common/ids";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";

describe("CircleSession マッパー", () => {
  test("Prisma CircleSession をドメインに変換できる", () => {
    const prismaSession: PrismaCircleSession = {
      id: "session-1",
      circleId: "circle-1",
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: "A",
      note: "メモ",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    };

    const session = mapCircleSessionToDomain(prismaSession);

    expect(session.id).toBe("session-1");
    expect(session.circleId).toBe("circle-1");
    expect(session.sequence).toBe(1);
    expect(session.location).toBe("A");
  });

  test("ドメイン CircleSession を永続化モデルに変換できる", () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: "A",
      note: "メモ",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const mapped = mapCircleSessionToPersistence(session);

    expect(mapped).toEqual({
      id: "session-1",
      circleId: "circle-1",
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: "A",
      note: "メモ",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
  });
});
