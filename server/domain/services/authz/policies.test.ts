import { describe, expect, test } from "vitest";
import {
  canAddCircleMember,
  canAddCircleSessionMember,
  canChangeCircleMemberRole,
  canChangeCircleSessionMemberRole,
  canCreateCircle,
  canCreateCircleSession,
  canDeleteCircle,
  canDeleteCircleSession,
  canDeleteMatch,
  canEditCircle,
  canEditCircleSession,
  canEditMatch,
  canListOwnCircles,
  canRecordMatch,
  canRemoveCircleMember,
  canRemoveCircleSessionMember,
  canTransferCircleOwnership,
  canTransferCircleSessionOwnership,
  canViewCircle,
  canViewCircleSession,
  canViewMatch,
  canViewMatchHistory,
  canViewUser,
} from "@/server/domain/services/authz/policies";
import {
  circleMembership,
  circleSessionMembership,
  noCircleMembership,
  noCircleSessionMembership,
} from "@/server/domain/services/authz/memberships";
import {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";

const member = (role: CircleRole) => circleMembership(role);
const noMember = () => noCircleMembership();
const sessionMember = (role: CircleSessionRole) =>
  circleSessionMembership(role);
const noSessionMember = () => noCircleSessionMembership();

const { CircleOwner, CircleManager, CircleMember } = CircleRole;
const { CircleSessionOwner, CircleSessionManager, CircleSessionMember } =
  CircleSessionRole;

describe("認可ポリシー", () => {
  describe("登録済みユーザー", () => {
    test.each([
      { label: "登録済み", value: true, expected: true },
      { label: "未登録", value: false, expected: false },
    ])("研究会作成: $label", ({ value, expected }) => {
      expect(canCreateCircle(value)).toBe(expected);
    });

    test.each([
      { label: "登録済み", value: true, expected: true },
      { label: "未登録", value: false, expected: false },
    ])("参加研究会一覧: $label", ({ value, expected }) => {
      expect(canListOwnCircles(value)).toBe(expected);
    });

    test.each([
      { label: "登録済み", value: true, expected: true },
      { label: "未登録", value: false, expected: false },
    ])("ユーザー閲覧: $label", ({ value, expected }) => {
      expect(canViewUser(value)).toBe(expected);
    });
  });

  describe("研究会", () => {
    test.each([
      { membership: member(CircleMember), expected: true },
      { membership: noMember(), expected: false },
    ])("研究会閲覧: $expected", ({ membership, expected }) => {
      expect(canViewCircle(membership)).toBe(expected);
    });

    test.each([
      { membership: member(CircleOwner), expected: true },
      { membership: member(CircleManager), expected: true },
      { membership: member(CircleMember), expected: false },
      { membership: noMember(), expected: false },
    ])("研究会編集: $expected", ({ membership, expected }) => {
      expect(canEditCircle(membership)).toBe(expected);
    });

    test.each([
      { membership: member(CircleOwner), expected: true },
      { membership: member(CircleManager), expected: false },
      { membership: noMember(), expected: false },
    ])("研究会削除: $expected", ({ membership, expected }) => {
      expect(canDeleteCircle(membership)).toBe(expected);
    });

    test.each([
      { membership: member(CircleMember), expected: true },
      { membership: noMember(), expected: false },
    ])("研究会参加者追加: $expected", ({ membership, expected }) => {
      expect(canAddCircleMember(membership)).toBe(expected);
    });

    test.each([
      { membership: member(CircleOwner), expected: true },
      { membership: member(CircleManager), expected: true },
      { membership: member(CircleMember), expected: false },
      { membership: noMember(), expected: false },
    ])("研究会参加者削除: $expected", ({ membership, expected }) => {
      expect(canRemoveCircleMember(membership)).toBe(expected);
    });

    test.each([
      {
        actor: noMember(),
        target: member(CircleMember),
        expected: false,
      },
      {
        actor: member(CircleMember),
        target: member(CircleMember),
        expected: false,
      },
      {
        actor: member(CircleManager),
        target: member(CircleMember),
        expected: true,
      },
      {
        actor: member(CircleManager),
        target: member(CircleOwner),
        expected: false,
      },
      {
        actor: member(CircleOwner),
        target: member(CircleManager),
        expected: true,
      },
    ])("研究会参加者ロール変更: $expected", ({ actor, target, expected }) => {
      expect(canChangeCircleMemberRole(actor, target)).toBe(expected);
    });

    test.each([
      { membership: member(CircleOwner), expected: true },
      { membership: member(CircleManager), expected: false },
      { membership: noMember(), expected: false },
    ])("研究会オーナー移譲: $expected", ({ membership, expected }) => {
      expect(canTransferCircleOwnership(membership)).toBe(expected);
    });

    test.each([
      { membership: member(CircleOwner), expected: true },
      { membership: member(CircleManager), expected: true },
      { membership: member(CircleMember), expected: false },
      { membership: noMember(), expected: false },
    ])("開催回作成: $expected", ({ membership, expected }) => {
      expect(canCreateCircleSession(membership)).toBe(expected);
    });
  });

  describe("開催回", () => {
    test.each([
      {
        circle: member(CircleMember),
        session: noSessionMember(),
        expected: true,
      },
      {
        circle: noMember(),
        session: sessionMember(CircleSessionMember),
        expected: true,
      },
      {
        circle: noMember(),
        session: noSessionMember(),
        expected: false,
      },
    ])("開催回閲覧: $expected", ({ circle, session, expected }) => {
      expect(canViewCircleSession(circle, session)).toBe(expected);
    });

    test.each([
      { membership: sessionMember(CircleSessionOwner), expected: true },
      { membership: sessionMember(CircleSessionManager), expected: true },
      { membership: sessionMember(CircleSessionMember), expected: false },
      { membership: noSessionMember(), expected: false },
    ])("開催回編集: $expected", ({ membership, expected }) => {
      expect(canEditCircleSession(membership)).toBe(expected);
    });

    test.each([
      { membership: sessionMember(CircleSessionOwner), expected: true },
      { membership: sessionMember(CircleSessionManager), expected: false },
      { membership: noSessionMember(), expected: false },
    ])("開催回削除: $expected", ({ membership, expected }) => {
      expect(canDeleteCircleSession(membership)).toBe(expected);
    });

    test.each([
      { membership: sessionMember(CircleSessionMember), expected: true },
      { membership: noSessionMember(), expected: false },
    ])("開催回参加者追加: $expected", ({ membership, expected }) => {
      expect(canAddCircleSessionMember(membership)).toBe(expected);
    });

    test.each([
      { membership: sessionMember(CircleSessionOwner), expected: true },
      { membership: sessionMember(CircleSessionManager), expected: true },
      { membership: sessionMember(CircleSessionMember), expected: false },
      { membership: noSessionMember(), expected: false },
    ])("開催回参加者削除: $expected", ({ membership, expected }) => {
      expect(canRemoveCircleSessionMember(membership)).toBe(expected);
    });

    test.each([
      {
        actor: noSessionMember(),
        target: sessionMember(CircleSessionMember),
        expected: false,
      },
      {
        actor: sessionMember(CircleSessionMember),
        target: sessionMember(CircleSessionMember),
        expected: false,
      },
      {
        actor: sessionMember(CircleSessionManager),
        target: sessionMember(CircleSessionMember),
        expected: true,
      },
      {
        actor: sessionMember(CircleSessionManager),
        target: sessionMember(CircleSessionOwner),
        expected: false,
      },
      {
        actor: sessionMember(CircleSessionOwner),
        target: sessionMember(CircleSessionManager),
        expected: true,
      },
    ])("開催回参加者ロール変更: $expected", ({ actor, target, expected }) => {
      expect(canChangeCircleSessionMemberRole(actor, target)).toBe(expected);
    });

    test.each([
      { membership: sessionMember(CircleSessionOwner), expected: true },
      { membership: sessionMember(CircleSessionManager), expected: false },
      { membership: noSessionMember(), expected: false },
    ])("開催回オーナー移譲: $expected", ({ membership, expected }) => {
      expect(canTransferCircleSessionOwnership(membership)).toBe(expected);
    });
  });

  describe("対局", () => {
    // 対局関連の5つのポリシー（記録・閲覧・編集・削除・履歴閲覧）は
    // すべて同一の認可条件「研究会メンバーまたは開催回メンバーであること」を持つ。
    // そのため同一のテストケースを共有し、ポリシー間の一貫性を保証している。
    const cases = [
      {
        label: "CircleMember",
        circle: member(CircleMember),
        session: noSessionMember(),
        expected: true,
      },
      {
        label: "CircleSessionMember",
        circle: noMember(),
        session: sessionMember(CircleSessionMember),
        expected: true,
      },
      {
        label: "非メンバー",
        circle: noMember(),
        session: noSessionMember(),
        expected: false,
      },
    ];

    const policies = [
      { label: "対局記録", fn: canRecordMatch },
      { label: "対局閲覧", fn: canViewMatch },
      { label: "対局編集", fn: canEditMatch },
      { label: "対局削除", fn: canDeleteMatch },
      { label: "対局履歴閲覧", fn: canViewMatchHistory },
    ];

    for (const policy of policies) {
      test.each(cases)(
        `${policy.label}: $label → $expected`,
        ({ circle, session, expected }) => {
          expect(policy.fn(circle, session)).toBe(expected);
        },
      );
    }
  });
});
