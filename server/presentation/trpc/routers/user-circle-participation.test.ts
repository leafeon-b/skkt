import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { circleId, userId } from "@/server/domain/common/ids";
import { ForbiddenError } from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof userId> | null = userId("user-1"),
) => {
  const circleParticipationService = {
    listByCircleId: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    changeParticipationRole: vi.fn(),
    withdrawParticipation: vi.fn(),
    removeParticipation: vi.fn(),
    transferOwnership: vi.fn(),
  };

  const context: Context = {
    actorId: actorIdValue,
    circleService: {
      getCircle: vi.fn(),
      createCircle: vi.fn(),
      renameCircle: vi.fn(),
      deleteCircle: vi.fn(),
    },
    circleParticipationService,
    circleSessionService: {
      listByCircleId: vi.fn(),
      getCircleSession: vi.fn(),
      createCircleSession: vi.fn(),
      rescheduleCircleSession: vi.fn(),
      updateCircleSessionDetails: vi.fn(),
      deleteCircleSession: vi.fn(),
    },
    circleSessionParticipationService: {
      countPastSessionsByUserId: vi.fn(),
      listParticipations: vi.fn(),
      listByUserId: vi.fn(),
      addParticipation: vi.fn(),
      changeParticipationRole: vi.fn(),
      removeParticipation: vi.fn(),
      transferOwnership: vi.fn(),
      withdrawParticipation: vi.fn(),
    },
    matchService: {
      listByCircleSessionId: vi.fn(),
      getMatch: vi.fn(),
      recordMatch: vi.fn(),
      updateMatch: vi.fn(),
      deleteMatch: vi.fn(),
    },
    matchHistoryService: {
      listByMatchId: vi.fn(),
    },
    userService: {
      getUser: vi.fn(),
      listUsers: vi.fn(),
      getMe: vi.fn(),
      updateProfile: vi.fn(),
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
    holidayProvider: {} as Context["holidayProvider"],
  };

  return { context, mocks: { circleParticipationService } };
};

describe("userCircleParticipation tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    test("ユーザーの研究会参加一覧を取得できる", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleParticipationService.listByUserId.mockResolvedValueOnce([
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
      const result = await caller.users.circles.participations.list({});

      expect(result).toHaveLength(2);
      expect(result[0].circleId).toBe("circle-1");
      expect(result[0].circleName).toBe("京大将棋研究会");
      expect(result[0].role).toBe("CircleMember");
      expect(result[1].circleId).toBe("circle-2");
      expect(result[1].role).toBe("CircleOwner");
      expect(
        mocks.circleParticipationService.listByUserId,
      ).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        userId: userId("user-1"),
      });
    });

    test("空配列を返す（参加なし）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleParticipationService.listByUserId.mockResolvedValueOnce([]);

      const caller = appRouter.createCaller(context);
      const result = await caller.users.circles.participations.list({});

      expect(result).toEqual([]);
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleParticipationService.listByUserId.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circles.participations.list({}),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circles.participations.list({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
