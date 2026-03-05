import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { circleId, userId } from "@/server/domain/common/ids";
import { ForbiddenError } from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof userId> | null = userId("user-1"),
) => {
  const circleMembershipService = {
    listByCircleId: vi.fn(),
    listByUserId: vi.fn(),
    addMembership: vi.fn(),
    changeMembershipRole: vi.fn(),
    withdrawMembership: vi.fn(),
    removeMembership: vi.fn(),
    transferOwnership: vi.fn(),
  };

  const context: Context = {
    actorId: actorIdValue,
    clientIp: "1.2.3.4",
    circleService: {
      getCircle: vi.fn(),
      createCircle: vi.fn(),
      renameCircle: vi.fn(),
      deleteCircle: vi.fn(),
    },
    circleMembershipService,
    circleSessionService: {
      listByCircleId: vi.fn(),
      getCircleSession: vi.fn(),
      createCircleSession: vi.fn(),
      rescheduleCircleSession: vi.fn(),
      updateCircleSessionDetails: vi.fn(),
      deleteCircleSession: vi.fn(),
    },
    circleSessionMembershipService: {
      countPastSessionsByUserId: vi.fn(),
      listMemberships: vi.fn(),
      listByUserId: vi.fn(),
      addMembership: vi.fn(),
      changeMembershipRole: vi.fn(),
      removeMembership: vi.fn(),
      transferOwnership: vi.fn(),
      withdrawMembership: vi.fn(),
      listDeletedMemberships: vi.fn(),
    },
    matchService: {
      listByCircleSessionId: vi.fn(),
      getMatch: vi.fn(),
      recordMatch: vi.fn(),
      updateMatch: vi.fn(),
      deleteMatch: vi.fn(),
    },
    userService: {
      getUser: vi.fn(),
      listUsers: vi.fn(),
      getMe: vi.fn(),
      updateProfile: vi.fn(),
      updateProfileVisibility: vi.fn(),
      changePassword: vi.fn(),
    },
    signupService: {
      signup: vi.fn(),
    },
    circleInviteLinkService: {
      createInviteLink: vi.fn(),
      getInviteLinkInfo: vi.fn(),
      redeemInviteLink: vi.fn(),
    },
    accessService: {} as Context["accessService"],
    userStatisticsService: {} as Context["userStatisticsService"],
    roundRobinScheduleService: {} as Context["roundRobinScheduleService"],
    holidayProvider: {} as Context["holidayProvider"],
  };

  return { context, mocks: { circleMembershipService } };
};

describe("userCircleMembership tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    test("ユーザーの研究会参加一覧を取得できる", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleMembershipService.listByUserId.mockResolvedValueOnce([
        {
          circleId: circleId("circle-1"),
          circleName: "京大将棋研究会",
          role: "CircleMember",
        },
        {
          circleId: circleId("circle-2"),
          circleName: "テスト研究会",
          role: "CircleOwner",
        },
      ]);

      const caller = appRouter.createCaller(context);
      const result = await caller.users.circles.memberships.list({});

      expect(result).toHaveLength(2);
      expect(result[0].circleId).toBe("circle-1");
      expect(result[0].circleName).toBe("京大将棋研究会");
      expect(result[0].role).toBe("CircleMember");
      expect(result[1].circleId).toBe("circle-2");
      expect(result[1].role).toBe("CircleOwner");
    });

    test("空配列を返す（参加なし）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleMembershipService.listByUserId.mockResolvedValueOnce([]);

      const caller = appRouter.createCaller(context);
      const result = await caller.users.circles.memberships.list({});

      expect(result).toEqual([]);
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleMembershipService.listByUserId.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circles.memberships.list({}),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circles.memberships.list({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
