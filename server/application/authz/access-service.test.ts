import { createAccessService } from "@/server/application/authz/access-service";
import {
  createInMemoryAuthzRepository,
  createInMemoryUserRepository,
} from "@/server/infrastructure/repository/in-memory";
import type { UserStore } from "@/server/infrastructure/repository/in-memory/in-memory-user-repository";
import type { CircleMembershipStore } from "@/server/infrastructure/repository/in-memory/in-memory-circle-repository";
import type { CircleSessionMembershipStore } from "@/server/infrastructure/repository/in-memory/in-memory-circle-session-repository";
import type {
  CircleMembershipStatus,
  CircleSessionMembershipStatus,
} from "@/server/domain/services/authz/memberships";
import {
  circleMembershipStatus,
  circleSessionMembershipStatus,
  noCircleMembershipStatus,
  noCircleSessionMembershipStatus,
} from "@/server/domain/services/authz/memberships";
import type { CircleRole } from "@/server/domain/models/circle/circle-role";
import type { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import { beforeEach, describe, expect, test } from "vitest";
import {
  toUserId as toUserId,
  toCircleId as toCircleId,
  toCircleSessionId as toCircleSessionId,
} from "@/server/domain/common/ids";
import { ProfileVisibility } from "@/server/domain/models/user/user";

const userId = "user-1";
const targetUserId = "user-2";
const circleId = "circle-1";
const circleSessionId = "circle-session-1";

const userStore: UserStore = new Map();
const circleMembershipStore: CircleMembershipStore = new Map();
const circleSessionMembershipStore: CircleSessionMembershipStore = new Map();

const repository = createInMemoryAuthzRepository({
  userStore,
  circleMembershipStore,
  circleSessionMembershipStore,
});

const userRepository = createInMemoryUserRepository(userStore);

const access = createAccessService({
  authzRepository: repository,
  userRepository,
});

const addUser = (id: string) => {
  userStore.set(id, {
    id: toUserId(id),
    name: "test",
    email: `${id}@test.com`,
    image: null,
    hasCustomImage: false,
    profileVisibility: "PUBLIC",
    createdAt: new Date(),
    passwordHash: null,
    passwordChangedAt: null,
  });
};

const addCircleMembership = (
  memberUserId: string,
  role: CircleRole,
  cId: string = circleId,
) => {
  const existing = circleMembershipStore.get(cId) ?? [];
  circleMembershipStore.set(cId, [
    ...existing,
    {
      circleId: toCircleId(cId),
      userId: toUserId(memberUserId),
      role,
      createdAt: new Date(),
      deletedAt: null,
    },
  ]);
};

const addCircleSessionMembership = (
  memberUserId: string,
  role: CircleSessionRole,
  csId: string = circleSessionId,
) => {
  const existing = circleSessionMembershipStore.get(csId) ?? [];
  circleSessionMembershipStore.set(csId, [
    ...existing,
    {
      circleSessionId: toCircleSessionId(csId),
      userId: toUserId(memberUserId),
      role,
      createdAt: new Date(),
      deletedAt: null,
    },
  ]);
};

const member = (role: CircleRole): CircleMembershipStatus =>
  circleMembershipStatus(role);
const noMember = (): CircleMembershipStatus => noCircleMembershipStatus();
const sessionMember = (
  role: CircleSessionRole,
): CircleSessionMembershipStatus => circleSessionMembershipStatus(role);
const noSessionMember = (): CircleSessionMembershipStatus =>
  noCircleSessionMembershipStatus();

const setCircleMembership = (membership: CircleMembershipStatus) => {
  if (membership.kind === "member") {
    addCircleMembership(userId, membership.role);
  }
};

const setCircleMemberships = (
  actorMembership: CircleMembershipStatus,
  targetMembership: CircleMembershipStatus,
) => {
  if (actorMembership.kind === "member") {
    addCircleMembership(userId, actorMembership.role);
  }
  if (targetMembership.kind === "member") {
    addCircleMembership(targetUserId, targetMembership.role);
  }
};

const setCircleSessionMembership = (
  membership: CircleSessionMembershipStatus,
) => {
  if (membership.kind === "member") {
    addCircleSessionMembership(userId, membership.role);
  }
};

const setCircleSessionMemberships = (
  actorMembership: CircleSessionMembershipStatus,
  targetMembership: CircleSessionMembershipStatus,
) => {
  if (actorMembership.kind === "member") {
    addCircleSessionMembership(userId, actorMembership.role);
  }
  if (targetMembership.kind === "member") {
    addCircleSessionMembership(targetUserId, targetMembership.role);
  }
};

beforeEach(() => {
  userStore.clear();
  circleMembershipStore.clear();
  circleSessionMembershipStore.clear();
});

describe("認可ポリシー", () => {
  describe("登録済みユーザー", () => {
    describe("canCreateCircle（研究会作成）", () => {
      test.each([
        { isRegisteredUser: true, expected: true },
        { isRegisteredUser: false, expected: false },
      ])("登録済み=$isRegisteredUser", async (item) => {
        if (item.isRegisteredUser) {
          addUser(userId);
        }
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
        if (item.isRegisteredUser) {
          addUser(userId);
        }
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
        if (item.isRegisteredUser) {
          addUser(userId);
        }
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

    describe("canWithdrawFromCircle（研究会退会）", () => {
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
        membership: CircleMembershipStatus;
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
        membership: CircleMembershipStatus;
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
        membership: CircleMembershipStatus;
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
        membership: CircleMembershipStatus;
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
        membership: CircleMembershipStatus;
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
        circleMembership: CircleMembershipStatus;
        sessionMembership: CircleSessionMembershipStatus;
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

    describe("canWithdrawFromCircleSession（セッション退会）", () => {
      test.each([
        { membership: sessionMember("CircleSessionMember"), expected: true },
        { membership: noSessionMember(), expected: false },
      ])("メンバー=$expected", async (item) => {
        setCircleSessionMembership(item.membership);
        await expect(
          access.canWithdrawFromCircleSession(userId, circleSessionId),
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
        membership: CircleSessionMembershipStatus;
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
        membership: CircleSessionMembershipStatus;
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
        membership: CircleSessionMembershipStatus;
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
        membership: CircleSessionMembershipStatus;
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
      circleMembership: CircleMembershipStatus;
      sessionMembership: CircleSessionMembershipStatus;
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
  });

  describe("プロフィール公開設定", () => {
    describe("canViewUserProfile（プロフィール統計閲覧）", () => {
      const actorId = toUserId("user-1");
      const targetId = toUserId("user-2");

      test("自分自身のプロフィールは常に閲覧可能", async () => {
        await expect(access.canViewUserProfile(actorId, actorId)).resolves.toBe(
          true,
        );
      });

      test("他者のPUBLICプロフィールは閲覧可能", async () => {
        userStore.set(targetId, {
          id: targetId,
          name: null,
          email: null,
          image: null,
          hasCustomImage: false,
          profileVisibility: ProfileVisibility.PUBLIC,
          createdAt: new Date(),
          passwordHash: null,
          passwordChangedAt: null,
        });
        await expect(
          access.canViewUserProfile(actorId, targetId),
        ).resolves.toBe(true);
      });

      test("他者のPRIVATEプロフィールは閲覧不可", async () => {
        userStore.set(targetId, {
          id: targetId,
          name: null,
          email: null,
          image: null,
          hasCustomImage: false,
          profileVisibility: ProfileVisibility.PRIVATE,
          createdAt: new Date(),
          passwordHash: null,
          passwordChangedAt: null,
        });
        await expect(
          access.canViewUserProfile(actorId, targetId),
        ).resolves.toBe(false);
      });

      test("対象ユーザーが存在しない場合は閲覧不可", async () => {
        await expect(
          access.canViewUserProfile(actorId, targetId),
        ).resolves.toBe(false);
      });
    });
  });
});
