import { describe, expect, test } from "vitest";
import {
  circleMembershipStatus,
  circleMembershipStatusFromRole,
  circleSessionMembershipStatus,
  circleSessionMembershipStatusFromRole,
  isCircleMemberStatus,
  isCircleSessionMemberStatus,
  noCircleMembershipStatus,
  noCircleSessionMembershipStatus,
} from "@/server/domain/services/authz/memberships";
import {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";

describe("メンバーシップステータス", () => {
  test("circleMembershipStatus は member を返す", () => {
    expect(circleMembershipStatus(CircleRole.CircleOwner)).toEqual({
      kind: "member",
      role: CircleRole.CircleOwner,
    });
  });

  test("noCircleMembershipStatus は none を返す", () => {
    expect(noCircleMembershipStatus()).toEqual({ kind: "none" });
  });

  test("circleMembershipStatusFromRole は null で none を返す", () => {
    expect(circleMembershipStatusFromRole(null)).toEqual({ kind: "none" });
  });

  test("circleMembershipStatusFromRole は role で member を返す", () => {
    expect(circleMembershipStatusFromRole(CircleRole.CircleMember)).toEqual({
      kind: "member",
      role: CircleRole.CircleMember,
    });
  });

  test("isCircleMemberStatus は member で true", () => {
    expect(
      isCircleMemberStatus(circleMembershipStatus(CircleRole.CircleManager)),
    ).toBe(true);
  });

  test("isCircleMemberStatus は none で false", () => {
    expect(isCircleMemberStatus(noCircleMembershipStatus())).toBe(false);
  });

  test("circleSessionMembershipStatus は member を返す", () => {
    expect(
      circleSessionMembershipStatus(CircleSessionRole.CircleSessionOwner),
    ).toEqual({
      kind: "member",
      role: CircleSessionRole.CircleSessionOwner,
    });
  });

  test("noCircleSessionMembershipStatus は none を返す", () => {
    expect(noCircleSessionMembershipStatus()).toEqual({ kind: "none" });
  });

  test("circleSessionMembershipStatusFromRole は null で none を返す", () => {
    expect(circleSessionMembershipStatusFromRole(null)).toEqual({
      kind: "none",
    });
  });

  test("circleSessionMembershipStatusFromRole は role で member を返す", () => {
    expect(
      circleSessionMembershipStatusFromRole(
        CircleSessionRole.CircleSessionMember,
      ),
    ).toEqual({
      kind: "member",
      role: CircleSessionRole.CircleSessionMember,
    });
  });

  test("isCircleSessionMemberStatus は member で true", () => {
    expect(
      isCircleSessionMemberStatus(
        circleSessionMembershipStatus(CircleSessionRole.CircleSessionManager),
      ),
    ).toBe(true);
  });

  test("isCircleSessionMemberStatus は none で false", () => {
    expect(
      isCircleSessionMemberStatus(noCircleSessionMembershipStatus()),
    ).toBe(false);
  });
});
