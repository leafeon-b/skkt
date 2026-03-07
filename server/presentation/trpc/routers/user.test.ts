import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { toUserId } from "@/server/domain/common/ids";
import {
  BadRequestError,
  ForbiddenError,
  TooManyRequestsError,
} from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof toUserId> | null = toUserId("user-1"),
) => {
  const userService = {
    getUser: vi.fn(),
    listUsers: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    updateProfileVisibility: vi.fn(),
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
    userService,
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

  return { context, mocks: { userService } };
};

describe("user tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("me", () => {
    test("ユーザー情報を meDtoSchema 準拠で返す", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.getMe.mockResolvedValueOnce({
        user: {
          id: toUserId("user-1"),
          name: "Taro",
          email: "taro@example.com",
          image: null,
          profileVisibility: "PUBLIC",
          createdAt: new Date("2024-01-01"),
        },
        hasPassword: true,
      });

      const caller = appRouter.createCaller(context);
      const result = await caller.users.me();

      expect(result.id).toBe("user-1");
      expect(result.name).toBe("Taro");
      expect(result.email).toBe("taro@example.com");
      expect(result.hasPassword).toBe(true);
      expect(result.profileVisibility).toBe("PUBLIC");
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.getMe.mockRejectedValueOnce(new ForbiddenError());

      const caller = appRouter.createCaller(context);

      await expect(caller.users.me()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("updateProfile", () => {
    test("BadRequestError → BAD_REQUEST", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.updateProfile.mockRejectedValueOnce(
        new BadRequestError("Email already in use"),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.updateProfile({
          name: "Name",
          email: "taken@example.com",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("changePassword", () => {
    test("BadRequestError → BAD_REQUEST", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.changePassword.mockRejectedValueOnce(
        new BadRequestError("Current password is incorrect"),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.changePassword({
          currentPassword: "wrongpass",
          newPassword: "newpass12",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("TooManyRequestsError → TOO_MANY_REQUESTS", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.changePassword.mockRejectedValueOnce(
        new TooManyRequestsError(50_000),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.changePassword({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        }),
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    });
  });

  describe("updateProfileVisibility", () => {
    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.updateProfileVisibility.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.updateProfileVisibility({ visibility: "PRIVATE" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("未認証アクセス", () => {
    test("me: actorId null で UNAUTHORIZED を返す", async () => {
      const { context } = createTestContext(null);

      const caller = appRouter.createCaller(context);

      await expect(caller.users.me()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    test("updateProfile: actorId null で UNAUTHORIZED を返す", async () => {
      const { context } = createTestContext(null);

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.updateProfile({
          name: "Name",
          email: "email@example.com",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    test("changePassword: actorId null で UNAUTHORIZED を返す", async () => {
      const { context } = createTestContext(null);

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.changePassword({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    test("updateProfileVisibility: actorId null で UNAUTHORIZED を返す", async () => {
      const { context } = createTestContext(null);

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.updateProfileVisibility({ visibility: "PRIVATE" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
