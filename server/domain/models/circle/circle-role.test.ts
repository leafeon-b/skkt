import {
  CircleRole,
  isSameOrHigherCircleRole,
} from "@/server/domain/models/circle/circle-role";
import { describe, expect, test } from "vitest";

const { CircleOwner, CircleManager, CircleMember } = CircleRole;

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
