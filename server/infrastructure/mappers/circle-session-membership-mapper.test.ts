import { describe, expect, test } from "vitest";
import { toCircleSessionId, toUserId } from "@/server/domain/common/ids";
import {
  mapCircleSessionMembershipFromPersistence,
  mapCircleSessionRoleFromPersistence,
  mapCircleSessionRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-session-membership-mapper";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";

describe("CircleSession メンバーシップマッパー", () => {
  test("CircleSessionId を永続化向けに変換できる", () => {
    const mapped = toPersistenceId(toCircleSessionId("session-1"));

    expect(mapped).toBe("session-1");
  });

  test("UserId 配列を永続化向けに変換できる", () => {
    const mapped = toPersistenceIds([toUserId("user-1"), toUserId("user-2")]);

    expect(mapped).toEqual(["user-1", "user-2"]);
  });

  test("CircleSessionRole を永続化向けに変換できる", () => {
    const mapped = mapCircleSessionRoleToPersistence(
      CircleSessionRole.CircleSessionOwner,
    );

    expect(mapped).toBe("CircleSessionOwner");
  });

  test("永続化のロールを CircleSessionRole に変換できる", () => {
    const mapped = mapCircleSessionRoleFromPersistence("CircleSessionMember");

    expect(mapped).toBe(CircleSessionRole.CircleSessionMember);
  });

  test("永続化データをメンバーシップに変換できる", () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    const mapped = mapCircleSessionMembershipFromPersistence({
      circleSessionId: "session-1",
      userId: "user-1",
      role: "CircleSessionManager",
      createdAt,
      deletedAt: null,
    });

    expect(mapped).toEqual({
      circleSessionId: toCircleSessionId("session-1"),
      userId: toUserId("user-1"),
      role: CircleSessionRole.CircleSessionManager,
      createdAt,
      deletedAt: null,
    });
  });
});
