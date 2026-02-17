import {
  CircleRole,
  CircleSessionRole,
  isSameOrHigherCircleRole,
  isSameOrHigherCircleSessionRole,
} from "@/server/domain/services/authz/roles";
import { describe, expect, test } from "vitest";

const { CircleOwner, CircleManager, CircleMember } = CircleRole;
const { CircleSessionOwner, CircleSessionManager, CircleSessionMember } =
  CircleSessionRole;

describe("ロール", () => {
  describe("研究会ロール", () => {
    test.each([
      // Owner（最上位）
      [CircleOwner, CircleOwner, true],
      [CircleOwner, CircleManager, true],
      [CircleOwner, CircleMember, true],
      // Manager（中位）
      [CircleManager, CircleOwner, false],
      [CircleManager, CircleManager, true],
      [CircleManager, CircleMember, true],
      // Member（最下位）
      [CircleMember, CircleOwner, false],
      [CircleMember, CircleManager, false],
      [CircleMember, CircleMember, true],
    ])(
      "isSameOrHigherCircleRole（%s と %s）",
      (actorRole, targetRole, expected) => {
        expect(isSameOrHigherCircleRole(actorRole, targetRole)).toBe(expected);
      },
    );
  });

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
});
