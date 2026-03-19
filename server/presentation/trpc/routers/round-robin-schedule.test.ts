import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import {
  toCircleSessionId,
  toRoundRobinScheduleId,
  toUserId,
} from "@/server/domain/common/ids";
import { BadRequestError, ForbiddenError } from "@/server/domain/common/errors";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { User } from "@/server/domain/models/user/user";

const createTestContext = (
  actorIdValue: ReturnType<typeof toUserId> | null = toUserId("user-1"),
) => {
  const roundRobinScheduleService = {
    getSchedule: vi.fn(),
    generateSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
  };

  const userService = {
    getUser: vi.fn(),
    listUsers: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
    updateProfileVisibility: vi.fn(),
    changePassword: vi.fn(),
    uploadAvatar: vi.fn().mockResolvedValue(undefined),
    findImageData: vi.fn().mockResolvedValue(null),
    deleteAccount: vi.fn(),
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
    roundRobinScheduleService,
    holidayProvider: {} as Context["holidayProvider"],
    notificationPreferenceService: {} as Context["notificationPreferenceService"],
  };

  return { context, mocks: { roundRobinScheduleService, userService } };
};

const baseSchedule = (): RoundRobinSchedule => ({
  id: toRoundRobinScheduleId("schedule-1"),
  circleSessionId: toCircleSessionId("session-1"),
  rounds: [
    {
      roundNumber: 1,
      pairings: [
        { player1Id: toUserId("player-1"), player2Id: toUserId("player-2") },
      ],
    },
  ],
  totalMatchCount: 1,
  createdAt: new Date("2024-06-01T10:00:00Z"),
});

const baseUsers = (): User[] => [
  {
    id: toUserId("player-1"),
    name: "Player 1",
    email: "player1@example.com",
    image: null,
    hasCustomImage: false,
    profileVisibility: "PUBLIC",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: toUserId("player-2"),
    name: "Player 2",
    email: "player2@example.com",
    image: null,
    hasCustomImage: false,
    profileVisibility: "PUBLIC",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
];

describe("roundRobinSchedule tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get", () => {
    test("スケジュール存在時: DTO形式で返却される", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.getSchedule.mockResolvedValueOnce(
        baseSchedule(),
      );
      mocks.userService.listUsers.mockResolvedValueOnce(baseUsers());

      const caller = appRouter.createCaller(context);
      const result = await caller.roundRobinSchedules.get({
        circleId: "circle-1",
        circleSessionId: "session-1",
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe("schedule-1");
      expect(result!.circleSessionId).toBe("session-1");
      expect(result!.totalMatchCount).toBe(1);
      expect(result!.rounds).toHaveLength(1);
      expect(result!.rounds[0].pairings[0].player1.id).toBe("player-1");
      expect(result!.rounds[0].pairings[0].player1.name).toBe("Player 1");
      expect(result!.rounds[0].pairings[0].player2.id).toBe("player-2");
    });

    test("スケジュール未存在時: nullを返す", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.getSchedule.mockResolvedValueOnce(null);

      const caller = appRouter.createCaller(context);
      const result = await caller.roundRobinSchedules.get({
        circleId: "circle-1",
        circleSessionId: "session-1",
      });

      expect(result).toBeNull();
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.getSchedule.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.roundRobinSchedules.get({
          circleId: "circle-1",
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.roundRobinSchedules.get({
          circleId: "circle-1",
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("generate", () => {
    test("正常生成: DTO形式で返却される", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.generateSchedule.mockResolvedValueOnce(
        baseSchedule(),
      );
      mocks.userService.listUsers.mockResolvedValueOnce(baseUsers());

      const caller = appRouter.createCaller(context);
      const result = await caller.roundRobinSchedules.generate({
        circleSessionId: "session-1",
      });

      expect(result.id).toBe("schedule-1");
      expect(result.circleSessionId).toBe("session-1");
      expect(result.rounds).toHaveLength(1);
      expect(result.rounds[0].pairings[0].player1.id).toBe("player-1");
      expect(result.rounds[0].pairings[0].player2.id).toBe("player-2");
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.generateSchedule.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.roundRobinSchedules.generate({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("BadRequestError → BAD_REQUEST", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.generateSchedule.mockRejectedValueOnce(
        new BadRequestError("Schedule already exists"),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.roundRobinSchedules.generate({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.roundRobinSchedules.generate({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("delete", () => {
    test("正常削除: voidを返す", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.deleteSchedule.mockResolvedValueOnce(
        undefined,
      );

      const caller = appRouter.createCaller(context);
      const result = await caller.roundRobinSchedules.delete({
        circleSessionId: "session-1",
      });

      expect(result).toBeUndefined();
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.roundRobinScheduleService.deleteSchedule.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.roundRobinSchedules.delete({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.roundRobinSchedules.delete({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
