import { describe, expect, test } from "vitest";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import {
  mapCircleMembershipFromPersistence,
  mapCircleRoleFromPersistence,
  mapCircleRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-membership-mapper";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";
import { CircleRole } from "@/server/domain/models/circle/circle-role";

describe("Circle メンバーシップマッパー", () => {
  test("CircleId を永続化向けに変換できる", () => {
    const mapped = toPersistenceId(toCircleId("circle-1"));

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

  test("永続化データをメンバーシップに変換できる", () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    const mapped = mapCircleMembershipFromPersistence({
      circleId: "circle-1",
      userId: "user-1",
      role: "CircleManager",
      createdAt,
      deletedAt: null,
    });

    expect(mapped).toEqual({
      circleId: toCircleId("circle-1"),
      userId: toUserId("user-1"),
      role: CircleRole.CircleManager,
      createdAt,
      deletedAt: null,
    });
  });
});
