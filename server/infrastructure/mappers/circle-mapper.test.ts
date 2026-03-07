import { describe, expect, test } from "vitest";
import type { Circle as PrismaCircle } from "@/generated/prisma/client";
import {
  mapCircleToDomain,
  mapCircleToPersistence,
} from "@/server/infrastructure/mappers/circle-mapper";
import { circleId } from "@/server/domain/common/ids";
import { createCircle } from "@/server/domain/models/circle/circle";

describe("Circle マッパー", () => {
  test("Prisma Circle をドメインに変換できる", () => {
    const prismaCircle: PrismaCircle = {
      id: "circle-1",
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sessionEmailNotificationEnabled: true,
    };

    const circle = mapCircleToDomain(prismaCircle);

    expect(circle.id).toBe("circle-1");
    expect(circle.name).toBe("Home");
    expect(circle.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  test("ドメイン Circle を永続化モデルに変換できる", () => {
    const circle = createCircle({
      id: circleId("circle-1"),
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const mapped = mapCircleToPersistence(circle);

    expect(mapped).toEqual({
      id: "circle-1",
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      sessionEmailNotificationEnabled: true,
    });
  });
});
