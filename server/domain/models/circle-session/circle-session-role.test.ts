import {
  CircleSessionRole,
  isSameOrHigherCircleSessionRole,
} from "@/server/domain/models/circle-session/circle-session-role";
import { describe, expect, test } from "vitest";

const { CircleSessionOwner, CircleSessionManager, CircleSessionMember } =
  CircleSessionRole;

describe("セッションロール", () => {
  test.each([
    // Owner（最上位）
    [CircleSessionOwner, CircleSessionOwner, true],
    [CircleSessionOwner, CircleSessionManager, true],
    [CircleSessionOwner, CircleSessionMember, true],
    // Manager（中位）
    [CircleSessionManager, CircleSessionOwner, false],
    [CircleSessionManager, CircleSessionManager, true],
    [CircleSessionManager, CircleSessionMember, true],
    // Member（最下位）
    [CircleSessionMember, CircleSessionOwner, false],
    [CircleSessionMember, CircleSessionManager, false],
    [CircleSessionMember, CircleSessionMember, true],
  ])(
    "isSameOrHigherCircleSessionRole（%s と %s）",
    (actorRole, targetRole, expected) => {
      expect(isSameOrHigherCircleSessionRole(actorRole, targetRole)).toBe(
        expected,
      );
    },
  );
});
