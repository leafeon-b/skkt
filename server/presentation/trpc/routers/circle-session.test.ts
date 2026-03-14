import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { toUserId } from "@/server/domain/common/ids";
import { BadRequestError } from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof toUserId> | null = toUserId("user-1"),
) => {
  const circleSessionService = {
    listByCircleId: vi.fn(),
    getCircleSession: vi.fn(),
    createCircleSession: vi.fn(),
    rescheduleCircleSession: vi.fn(),
    updateCircleSessionDetails: vi.fn(),
    deleteCircleSession: vi.fn(),
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
    circleSessionService,
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
      uploadAvatar: vi.fn().mockResolvedValue(undefined),
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

  return { context, mocks: { circleSessionService } };
};

describe("circle-session tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    test("空のセッション名 → BAD_REQUEST（Zodバリデーション）", async () => {
      const { context, mocks } = createTestContext();

      const caller = appRouter.createCaller(context);

      await expect(
        caller.circleSessions.create({
          circleId: "circle-1",
          title: "",
          startsAt: new Date("2024-06-01T10:00:00Z"),
          endsAt: new Date("2024-06-01T12:00:00Z"),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      expect(
        mocks.circleSessionService.createCircleSession,
      ).not.toHaveBeenCalled();
    });

    test("BadRequestError（開始日時が終了日時より後）→ BAD_REQUEST", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionService.createCircleSession.mockRejectedValueOnce(
        new BadRequestError(
          "CircleSession start must be before or equal to end",
        ),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.circleSessions.create({
          circleId: "circle-1",
          title: "テストセッション",
          startsAt: new Date("2024-06-01T14:00:00Z"),
          endsAt: new Date("2024-06-01T10:00:00Z"),
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "CircleSession start must be before or equal to end",
      });

      expect(
        mocks.circleSessionService.createCircleSession,
      ).toHaveBeenCalledOnce();
    });
  });
});
