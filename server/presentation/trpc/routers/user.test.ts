import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { userId } from "@/server/domain/common/ids";
import {
  BadRequestError,
  ForbiddenError,
  TooManyRequestsError,
} from "@/server/domain/common/errors";

const createTestContext = (actorIdValue: ReturnType<typeof userId> | null = userId("user-1")) => {
  const userService = {
    getUser: vi.fn(),
    listUsers: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  };

  const context: Context = {
    actorId: actorIdValue,
    circleService: {
      getCircle: vi.fn(),
      createCircle: vi.fn(),
      renameCircle: vi.fn(),
      deleteCircle: vi.fn(),
    },
    circleParticipationService: {
      listByCircleId: vi.fn(),
      listByUserId: vi.fn(),
      addParticipation: vi.fn(),
      changeParticipationRole: vi.fn(),
      withdrawParticipation: vi.fn(),
      removeParticipation: vi.fn(),
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
    holidayProvider: {} as Context["holidayProvider"],
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
          id: userId("user-1"),
          name: "Taro",
          email: "taro@example.com",
          image: null,
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
      expect(mocks.userService.getMe).toHaveBeenCalledWith(userId("user-1"));
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
    test("正常入力で userService.updateProfile が正しい引数で呼ばれる", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.updateProfile.mockResolvedValueOnce(undefined);

      const caller = appRouter.createCaller(context);
      await caller.users.updateProfile({
        name: "NewName",
        email: "new@example.com",
      });

      expect(mocks.userService.updateProfile).toHaveBeenCalledWith(
        userId("user-1"),
        "NewName",
        "new@example.com",
      );
    });

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
    test("正常入力で userService.changePassword が正しい引数で呼ばれる", async () => {
      const { context, mocks } = createTestContext();
      mocks.userService.changePassword.mockResolvedValueOnce(undefined);

      const caller = appRouter.createCaller(context);
      await caller.users.changePassword({
        currentPassword: "oldpass12",
        newPassword: "newpass12",
      });

      expect(mocks.userService.changePassword).toHaveBeenCalledWith(
        userId("user-1"),
        "oldpass12",
        "newpass12",
      );
    });

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
        new TooManyRequestsError(),
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
  });
});
