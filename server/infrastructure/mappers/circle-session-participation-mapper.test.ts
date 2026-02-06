import { describe, expect, test } from "vitest";
import { circleSessionId, userId } from "@/server/domain/common/ids";
import {
  mapCircleSessionParticipationFromPersistence,
  mapCircleSessionRoleFromPersistence,
  mapCircleSessionRoleToPersistence,
} from "@/server/infrastructure/mappers/circle-session-participation-mapper";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";
import { CircleSessionRole } from "@/server/domain/services/authz/roles";

describe("CircleSession 参加者マッパー", () => {
  test("CircleSessionId を永続化向けに変換できる", () => {
    const mapped = toPersistenceId(circleSessionId("session-1"));

    expect(mapped).toBe("session-1");
  });

  test("UserId 配列を永続化向けに変換できる", () => {
    const mapped = toPersistenceIds([userId("user-1"), userId("user-2")]);

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

  test("永続化データを参加関係に変換できる", () => {
    const mapped = mapCircleSessionParticipationFromPersistence({
      circleSessionId: "session-1",
      userId: "user-1",
      role: "CircleSessionManager",
    });

    expect(mapped).toEqual({
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-1"),
      role: CircleSessionRole.CircleSessionManager,
    });
  });
});
