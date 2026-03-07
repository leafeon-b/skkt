import { ForbiddenError } from "@/server/domain/common/errors";
import {
  circleId,
  circleInviteLinkId,
  userId,
} from "@/server/domain/common/ids";
import type { Context } from "@/server/presentation/trpc/context";
import { appRouter } from "@/server/presentation/trpc/router";
import { beforeEach, describe, expect, test, vi } from "vitest";

const TEST_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440000";

const createTestContext = () => {
  const circleInviteLinkService = {
    createInviteLink: vi.fn(),
    getInviteLinkInfo: vi.fn(),
    redeemInviteLink: vi.fn(),
  };

  const context: Context = {
    actorId: userId("user-1"),
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
    circleInviteLinkService,
    accessService: {} as Context["accessService"],
    userStatisticsService: {} as Context["userStatisticsService"],
    roundRobinScheduleService: {} as Context["roundRobinScheduleService"],
    holidayProvider: {} as Context["holidayProvider"],
    notificationPreferenceService: {} as Context["notificationPreferenceService"],
  };

  return { context, mocks: { circleInviteLinkService } };
};

describe("circleInviteLink tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("circles.inviteLinks.create は招待リンクを返す", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.createInviteLink.mockResolvedValueOnce({
      id: circleInviteLinkId("link-1"),
      circleId: circleId("circle-1"),
      token: TEST_TOKEN_UUID,
      createdByUserId: userId("user-1"),
      expiresAt: new Date("2026-02-23T00:00:00Z"),
      createdAt: new Date("2026-02-16T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.inviteLinks.create({
      circleId: "circle-1",
    });

    expect(result.token).toBe(TEST_TOKEN_UUID);
    expect(result.circleId).toBe("circle-1");
  });

  test("circles.inviteLinks.getInfo はリンク情報を返す", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.getInviteLinkInfo.mockResolvedValueOnce({
      token: TEST_TOKEN_UUID,
      circleName: "テスト研究会",
      circleId: circleId("circle-1"),
      expired: false,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.inviteLinks.getInfo({
      token: TEST_TOKEN_UUID,
    });

    expect(result.circleName).toBe("テスト研究会");
    expect(result.expired).toBe(false);
  });

  test("circles.inviteLinks.redeem は参加結果を返す", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.redeemInviteLink.mockResolvedValueOnce({
      circleId: circleId("circle-1"),
      alreadyMember: false,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.inviteLinks.redeem({
      token: TEST_TOKEN_UUID,
    });

    expect(result.circleId).toBe("circle-1");
    expect(result.alreadyMember).toBe(false);
  });

  test("circles.inviteLinks.redeem は既存メンバーの場合 alreadyMember=true", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.redeemInviteLink.mockResolvedValueOnce({
      circleId: circleId("circle-1"),
      alreadyMember: true,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.inviteLinks.redeem({
      token: TEST_TOKEN_UUID,
    });

    expect(result.alreadyMember).toBe(true);
  });

  test("circles.inviteLinks.create はエラー時に適切なTRPCエラーを返す", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.createInviteLink.mockRejectedValueOnce(
      new ForbiddenError(),
    );

    const caller = appRouter.createCaller(context);

    await expect(
      caller.circles.inviteLinks.create({ circleId: "circle-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("不正な形式のトークンはバリデーションエラーになる", async () => {
    const { context } = createTestContext();
    const caller = appRouter.createCaller(context);

    await expect(
      caller.circles.inviteLinks.getInfo({ token: "not-a-uuid" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
