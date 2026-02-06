import { describe, expect, test } from "vitest";
import { circleId, userId } from "@/server/domain/common/ids";
import {
  mapCircleParticipationFromPersistence,
  mapCircleRoleFromPersistence,
  mapCircleRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-participation-mapper";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";
import { CircleRole } from "@/server/domain/services/authz/roles";

describe("Circle 参加者マッパー", () => {
  test("CircleId を永続化向けに変換できる", () => {
    const mapped = toPersistenceId(circleId("circle-1"));

    expect(mapped).toBe("circle-1");
  });

  test("CircleRole を永続化向けに変換できる", () => {
    const mapped = mapCircleRoleToPersistence(CircleRole.CircleOwner);

    expect(mapped).toBe("CircleOwner");
  });

  test("永続化のロールを CircleRole に変換できる", () => {
    const mapped = mapCircleRoleFromPersistence("CircleMember");

    expect(mapped).toBe(CircleRole.CircleMember);
  });

  test("永続化データを参加関係に変換できる", () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    const mapped = mapCircleParticipationFromPersistence({
      circleId: "circle-1",
      userId: "user-1",
      role: "CircleManager",
      createdAt,
    });

    expect(mapped).toEqual({
      circleId: circleId("circle-1"),
      userId: userId("user-1"),
      role: CircleRole.CircleManager,
      createdAt,
    });
  });
});
