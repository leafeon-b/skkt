import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";
import { ForbiddenError } from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof userId> | null = userId("user-1"),
) => {
  const circleSessionMembershipService = {
    countPastSessionsByUserId: vi.fn(),
    listMemberships: vi.fn(),
    listByUserId: vi.fn(),
    addMembership: vi.fn(),
    changeMembershipRole: vi.fn(),
    removeMembership: vi.fn(),
    transferOwnership: vi.fn(),
    withdrawMembership: vi.fn(),
    listDeletedMemberships: vi.fn(),
  };

  const context: Context = {
    actorId: actorIdValue,
    clientIp: "1.2.3.4",
    circleService: {
      getCircle: vi.fn(),
      createCircle: vi.fn(),
      renameCircle: vi.fn(),
      deleteCircle: vi.fn(),
      updateSessionEmailNotificationEnabled: vi.fn(),
    },
    circleMembershipService: {
      listByCircleId: vi.fn(),
      listByUserId: vi.fn(),
      addMembership: vi.fn(),
      changeMembershipRole: vi.fn(),
      withdrawMembership: vi.fn(),
      removeMembership: vi.fn(),
      transferOwnership: vi.fn(),
    },
    circleSessionService: {
      listByCircleId: vi.fn(),
      getCircleSession: vi.fn(),
      createCircleSession: vi.fn(),
      rescheduleCircleSession: vi.fn(),
      updateCircleSessionDetails: vi.fn(),
      deleteCircleSession: vi.fn(),
    },
    circleSessionMembershipService,
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
    notificationPreferenceService: {} as Context["notificationPreferenceService"],
  };

  return { context, mocks: { circleSessionMembershipService } };
};

const baseSummary = (overrides?: Record<string, unknown>) => ({
  circleSessionId: circleSessionId("session-1"),
  circleId: circleId("circle-1"),
  circleName: "さくら将棋研究会",
  title: "第1回例会",
  startsAt: new Date("2024-06-01T13:00:00Z"),
  endsAt: new Date("2024-06-01T17:00:00Z"),
  location: "部室",
  ...overrides,
});

describe("userCircleSessionMembership tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    test("ユーザーのセッション参加一覧を取得できる（limit 指定あり）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionMembershipService.listByUserId.mockResolvedValueOnce([
        baseSummary(),
      ]);

      const caller = appRouter.createCaller(context);
      const result = await caller.users.circleSessions.memberships.list({
        limit: 5,
      });

      expect(result).toHaveLength(1);
      expect(result[0].circleSessionId).toBe("session-1");
      expect(result[0].circleId).toBe("circle-1");
      expect(result[0].circleName).toBe("さくら将棋研究会");
      expect(result[0].title).toBe("第1回例会");
      expect(result[0].location).toBe("部室");
    });

    test("ユーザーのセッション参加一覧を取得できる（limit 省略）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionMembershipService.listByUserId.mockResolvedValueOnce([
        baseSummary(),
      ]);

      const caller = appRouter.createCaller(context);
      const result = await caller.users.circleSessions.memberships.list({});

      expect(result).toHaveLength(1);
    });

    test("空配列を返す（参加なし）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionMembershipService.listByUserId.mockResolvedValueOnce(
        [],
      );

      const caller = appRouter.createCaller(context);
      const result = await caller.users.circleSessions.memberships.list({});

      expect(result).toEqual([]);
    });

    test("location が null の場合も正しく返す", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionMembershipService.listByUserId.mockResolvedValueOnce([
        baseSummary({ location: null }),
      ]);

      const caller = appRouter.createCaller(context);
      const result = await caller.users.circleSessions.memberships.list({});

      expect(result[0].location).toBeNull();
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionMembershipService.listByUserId.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circleSessions.memberships.list({}),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circleSessions.memberships.list({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
