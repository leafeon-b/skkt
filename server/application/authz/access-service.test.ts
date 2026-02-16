import { createAccessService } from "@/server/application/authz/access-service";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type {
  CircleMembership,
  CircleSessionMembership,
} from "@/server/domain/services/authz/memberships";
import {
  circleMembership,
  circleSessionMembership,
  noCircleMembership,
  noCircleSessionMembership,
} from "@/server/domain/services/authz/memberships";
import type {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";
import { beforeEach, describe, expect, test, vi } from "vitest";

const userId = "user-1";
const targetUserId = "user-2";
const circleId = "circle-1";
const circleSessionId = "circle-session-1";

const repository = {
  isRegisteredUser: vi.fn(),
  findCircleMembership: vi.fn(),
  findCircleSessionMembership: vi.fn(),
} satisfies AuthzRepository;

const access = createAccessService(repository);

const mockedIsRegisteredUser = vi.mocked(repository.isRegisteredUser);
const mockedFindCircleMembership = vi.mocked(repository.findCircleMembership);
const mockedFindCircleSessionMembership = vi.mocked(
  repository.findCircleSessionMembership,
);

const member = (role: CircleRole): CircleMembership => circleMembership(role);
const noMember = (): CircleMembership => noCircleMembership();
const sessionMember = (role: CircleSessionRole): CircleSessionMembership =>
  circleSessionMembership(role);
const noSessionMember = (): CircleSessionMembership =>
  noCircleSessionMembership();

const setCircleMembership = (membership: CircleMembership) => {
  mockedFindCircleMembership.mockResolvedValue(membership);
};

const setCircleMemberships = (
  actorMembership: CircleMembership,
  targetMembership: CircleMembership,
) => {
  mockedFindCircleMembership.mockImplementation(
    async (requestedUserId: string) =>
      requestedUserId === userId ? actorMembership : targetMembership,
  );
};

const setCircleSessionMembership = (membership: CircleSessionMembership) => {
  mockedFindCircleSessionMembership.mockResolvedValue(membership);
};

const setCircleSessionMemberships = (
  actorMembership: CircleSessionMembership,
  targetMembership: CircleSessionMembership,
) => {
  mockedFindCircleSessionMembership.mockImplementation(
    async (requestedUserId: string) =>
      requestedUserId === userId ? actorMembership : targetMembership,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedIsRegisteredUser.mockResolvedValue(false);
  mockedFindCircleMembership.mockResolvedValue(noCircleMembership());
  mockedFindCircleSessionMembership.mockResolvedValue(
    noCircleSessionMembership(),
  );
});

describe("認可ポリシー", () => {
  describe("登録済みユーザー", () => {
    describe("canCreateCircle（研究会作成）", () => {
      test.each([
        { isRegisteredUser: true, expected: true },
        { isRegisteredUser: false, expected: false },
      ])("登録済み=$isRegisteredUser", async (item) => {
        mockedIsRegisteredUser.mockResolvedValueOnce(item.isRegisteredUser);
        await expect(access.canCreateCircle(userId)).resolves.toBe(
          item.expected,
        );
      });
    });

    describe("canListOwnCircles（参加研究会一覧）", () => {
      test.each([
        { isRegisteredUser: true, expected: true },
        { isRegisteredUser: false, expected: false },
      ])("登録済み=$isRegisteredUser", async (item) => {
        mockedIsRegisteredUser.mockResolvedValueOnce(item.isRegisteredUser);
        await expect(access.canListOwnCircles(userId)).resolves.toBe(
          item.expected,
        );
      });
    });

    describe("canViewUser（ユーザー閲覧）", () => {
      test.each([
        { isRegisteredUser: true, expected: true },
        { isRegisteredUser: false, expected: false },
      ])("登録済み=$isRegisteredUser", async (item) => {
        mockedIsRegisteredUser.mockResolvedValueOnce(item.isRegisteredUser);
        await expect(access.canViewUser(userId)).resolves.toBe(item.expected);
      });
    });
  });

  describe("研究会", () => {
    describe("canViewCircle（研究会閲覧）", () => {
      test.each([
        { membership: member("CircleMember"), expected: true },
        { membership: noMember(), expected: false },
      ])("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(access.canViewCircle(userId, circleId)).resolves.toBe(
          item.expected,
        );
      });
    });

    describe("canWithdrawFromCircle（研究会脱退）", () => {
      test.each([
        { membership: member("CircleMember"), expected: true },
        { membership: noMember(), expected: false },
      ])("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(
          access.canWithdrawFromCircle(userId, circleId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canAddCircleMember（研究会参加者追加）", () => {
      test.each([
        { membership: member("CircleMember"), expected: true },
        { membership: noMember(), expected: false },
      ])("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(access.canAddCircleMember(userId, circleId)).resolves.toBe(
          item.expected,
        );
      });
    });

    describe("canEditCircle（研究会編集）", () => {
      const cases: Array<{
        membership: CircleMembership;
        expected: boolean;
      }> = [
        { membership: member("CircleOwner"), expected: true },
        { membership: member("CircleManager"), expected: true },
        { membership: member("CircleMember"), expected: false },
        { membership: noMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(access.canEditCircle(userId, circleId)).resolves.toBe(
          item.expected,
        );
      });
    });

    describe("canDeleteCircle（研究会削除）", () => {
      const cases: Array<{
        membership: CircleMembership;
        expected: boolean;
      }> = [
        { membership: member("CircleOwner"), expected: true },
        { membership: member("CircleManager"), expected: false },
        { membership: noMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(access.canDeleteCircle(userId, circleId)).resolves.toBe(
          item.expected,
        );
      });
    });

    describe("canRemoveCircleMember（研究会参加者削除）", () => {
      const cases: Array<{
        membership: CircleMembership;
        expected: boolean;
      }> = [
        { membership: member("CircleOwner"), expected: true },
        { membership: member("CircleManager"), expected: true },
        { membership: member("CircleMember"), expected: false },
        { membership: noMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(
          access.canRemoveCircleMember(userId, circleId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canTransferCircleOwnership（研究会オーナー移譲）", () => {
      const cases: Array<{
        membership: CircleMembership;
        expected: boolean;
      }> = [
        { membership: member("CircleOwner"), expected: true },
        { membership: member("CircleManager"), expected: false },
        { membership: noMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(
          access.canTransferCircleOwnership(userId, circleId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canChangeCircleMemberRole（研究会参加者ロール変更）", () => {
      const cases: Array<{
        actorRole: CircleRole;
        targetRole: CircleRole;
        expected: boolean;
      }> = [
        {
          actorRole: "CircleOwner",
          targetRole: "CircleManager",
          expected: true,
        },
        {
          actorRole: "CircleManager",
          targetRole: "CircleOwner",
          expected: false,
        },
        {
          actorRole: "CircleManager",
          targetRole: "CircleMember",
          expected: true,
        },
        {
          actorRole: "CircleMember",
          targetRole: "CircleMember",
          expected: false,
        },
        { actorRole: "CircleOwner", targetRole: "CircleOwner", expected: true },
        {
          actorRole: "CircleManager",
          targetRole: "CircleManager",
          expected: true,
        },
      ];

      test.each(cases)("操作側=$actorRole 対象側=$targetRole", async (item) => {
        setCircleMemberships(member(item.actorRole), member(item.targetRole));
        await expect(
          access.canChangeCircleMemberRole(userId, targetUserId, circleId),
        ).resolves.toBe(item.expected);
      });
    });
  });

  describe("セッション", () => {
    describe("canCreateCircleSession（セッション作成）", () => {
      const cases: Array<{
        membership: CircleMembership;
        expected: boolean;
      }> = [
        { membership: member("CircleOwner"), expected: true },
        { membership: member("CircleManager"), expected: true },
        { membership: member("CircleMember"), expected: false },
        { membership: noMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleMembership(item.membership);
        await expect(
          access.canCreateCircleSession(userId, circleId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canViewCircleSession（セッション閲覧）", () => {
      const cases: Array<{
        circleMembership: CircleMembership;
        sessionMembership: CircleSessionMembership;
        expected: boolean;
      }> = [
        {
          circleMembership: member("CircleMember"),
          sessionMembership: noSessionMember(),
          expected: true,
        },
        {
          circleMembership: noMember(),
          sessionMembership: sessionMember("CircleSessionMember"),
          expected: true,
        },
        {
          circleMembership: noMember(),
          sessionMembership: noSessionMember(),
          expected: false,
        },
      ];

      test.each(cases)("研究会メンバー=$expected", async (item) => {
        setCircleMembership(item.circleMembership);
        setCircleSessionMembership(item.sessionMembership);
        await expect(
          access.canViewCircleSession(userId, circleId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canAddCircleSessionMember（セッション参加者追加）", () => {
      test.each([
        { membership: sessionMember("CircleSessionMember"), expected: true },
        { membership: noSessionMember(), expected: false },
      ])("メンバー=$expected", async (item) => {
        setCircleSessionMembership(item.membership);
        await expect(
          access.canAddCircleSessionMember(userId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canEditCircleSession（セッション編集）", () => {
      const cases: Array<{
        membership: CircleSessionMembership;
        expected: boolean;
      }> = [
        { membership: sessionMember("CircleSessionOwner"), expected: true },
        { membership: sessionMember("CircleSessionManager"), expected: true },
        { membership: sessionMember("CircleSessionMember"), expected: false },
        { membership: noSessionMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleSessionMembership(item.membership);
        await expect(
          access.canEditCircleSession(userId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canDeleteCircleSession（セッション削除）", () => {
      const cases: Array<{
        membership: CircleSessionMembership;
        expected: boolean;
      }> = [
        { membership: sessionMember("CircleSessionOwner"), expected: true },
        { membership: sessionMember("CircleSessionManager"), expected: false },
        { membership: noSessionMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleSessionMembership(item.membership);
        await expect(
          access.canDeleteCircleSession(userId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canRemoveCircleSessionMember（セッション参加取消）", () => {
      const cases: Array<{
        membership: CircleSessionMembership;
        expected: boolean;
      }> = [
        { membership: sessionMember("CircleSessionOwner"), expected: true },
        { membership: sessionMember("CircleSessionManager"), expected: true },
        { membership: sessionMember("CircleSessionMember"), expected: false },
        { membership: noSessionMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleSessionMembership(item.membership);
        await expect(
          access.canRemoveCircleSessionMember(userId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canTransferCircleSessionOwnership（セッションオーナー移譲）", () => {
      const cases: Array<{
        membership: CircleSessionMembership;
        expected: boolean;
      }> = [
        { membership: sessionMember("CircleSessionOwner"), expected: true },
        { membership: sessionMember("CircleSessionManager"), expected: false },
        { membership: noSessionMember(), expected: false },
      ];

      test.each(cases)("メンバー=$expected", async (item) => {
        setCircleSessionMembership(item.membership);
        await expect(
          access.canTransferCircleSessionOwnership(userId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canChangeCircleSessionMemberRole（セッション参加者ロール変更）", () => {
      const cases: Array<{
        actorRole: CircleSessionRole;
        targetRole: CircleSessionRole;
        expected: boolean;
      }> = [
        {
          actorRole: "CircleSessionOwner",
          targetRole: "CircleSessionManager",
          expected: true,
        },
        {
          actorRole: "CircleSessionManager",
          targetRole: "CircleSessionOwner",
          expected: false,
        },
        {
          actorRole: "CircleSessionManager",
          targetRole: "CircleSessionMember",
          expected: true,
        },
        {
          actorRole: "CircleSessionMember",
          targetRole: "CircleSessionMember",
          expected: false,
        },
        {
          actorRole: "CircleSessionOwner",
          targetRole: "CircleSessionOwner",
          expected: true,
        },
        {
          actorRole: "CircleSessionManager",
          targetRole: "CircleSessionManager",
          expected: true,
        },
      ];

      test.each(cases)("操作側=$actorRole 対象側=$targetRole", async (item) => {
        setCircleSessionMemberships(
          sessionMember(item.actorRole),
          sessionMember(item.targetRole),
        );
        await expect(
          access.canChangeCircleSessionMemberRole(
            userId,
            targetUserId,
            circleSessionId,
          ),
        ).resolves.toBe(item.expected);
      });
    });
  });

  describe("対局結果", () => {
    const membershipCases: Array<{
      circleMembership: CircleMembership;
      sessionMembership: CircleSessionMembership;
      expected: boolean;
    }> = [
      {
        circleMembership: member("CircleMember"),
        sessionMembership: noSessionMember(),
        expected: true,
      },
      {
        circleMembership: noMember(),
        sessionMembership: sessionMember("CircleSessionMember"),
        expected: true,
      },
      {
        circleMembership: noMember(),
        sessionMembership: noSessionMember(),
        expected: false,
      },
    ];

    describe("canRecordMatch（対局結果記録）", () => {
      test.each(membershipCases)("研究会メンバー=$expected", async (item) => {
        setCircleMembership(item.circleMembership);
        setCircleSessionMembership(item.sessionMembership);
        await expect(
          access.canRecordMatch(userId, circleId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canViewMatch（対局結果閲覧）", () => {
      test.each(membershipCases)("研究会メンバー=$expected", async (item) => {
        setCircleMembership(item.circleMembership);
        setCircleSessionMembership(item.sessionMembership);
        await expect(
          access.canViewMatch(userId, circleId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canEditMatch（対局結果修正）", () => {
      test.each(membershipCases)("研究会メンバー=$expected", async (item) => {
        setCircleMembership(item.circleMembership);
        setCircleSessionMembership(item.sessionMembership);
        await expect(
          access.canEditMatch(userId, circleId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canDeleteMatch（対局結果削除）", () => {
      test.each(membershipCases)("研究会メンバー=$expected", async (item) => {
        setCircleMembership(item.circleMembership);
        setCircleSessionMembership(item.sessionMembership);
        await expect(
          access.canDeleteMatch(userId, circleId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });

    describe("canViewMatchHistory（対局結果編集履歴閲覧）", () => {
      test.each(membershipCases)("研究会メンバー=$expected", async (item) => {
        setCircleMembership(item.circleMembership);
        setCircleSessionMembership(item.sessionMembership);
        await expect(
          access.canViewMatchHistory(userId, circleId, circleSessionId),
        ).resolves.toBe(item.expected);
      });
    });
  });
});
