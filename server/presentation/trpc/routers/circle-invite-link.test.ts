import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { circleId, circleInviteLinkId, userId } from "@/server/domain/common/ids";

const createTestContext = () => {
  const circleInviteLinkService = {
    createInviteLink: vi.fn(),
    getInviteLinkInfo: vi.fn(),
    redeemInviteLink: vi.fn(),
  };

  const context: Context = {
    actorId: "user-1",
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
    },
    signupService: {
      signup: vi.fn(),
    },
    circleInviteLinkService,
    accessService: {} as Context["accessService"],
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
      token: "test-token-123",
      createdByUserId: userId("user-1"),
      expiresAt: new Date("2026-02-23T00:00:00Z"),
      createdAt: new Date("2026-02-16T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.inviteLinks.create({
      circleId: "circle-1",
    });

    expect(result.token).toBe("test-token-123");
    expect(result.circleId).toBe("circle-1");
    expect(
      mocks.circleInviteLinkService.createInviteLink,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleId: circleId("circle-1"),
      expiryDays: undefined,
    });
  });

  test("circles.inviteLinks.getInfo はリンク情報を返す", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.getInviteLinkInfo.mockResolvedValueOnce({
      token: "test-token-123",
      circleName: "テスト研究会",
      circleId: circleId("circle-1"),
      expired: false,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.inviteLinks.getInfo({
      token: "test-token-123",
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
      token: "test-token-123",
    });

    expect(result.circleId).toBe("circle-1");
    expect(result.alreadyMember).toBe(false);
    expect(
      mocks.circleInviteLinkService.redeemInviteLink,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      token: "test-token-123",
    });
  });

  test("circles.inviteLinks.redeem は既存メンバーの場合 alreadyMember=true", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.redeemInviteLink.mockResolvedValueOnce({
      circleId: circleId("circle-1"),
      alreadyMember: true,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.inviteLinks.redeem({
      token: "test-token-123",
    });

    expect(result.alreadyMember).toBe(true);
  });

  test("circles.inviteLinks.create はエラー時に適切なTRPCエラーを返す", async () => {
    const { context, mocks } = createTestContext();
    mocks.circleInviteLinkService.createInviteLink.mockRejectedValueOnce(
      new Error("Forbidden"),
    );

    const caller = appRouter.createCaller(context);

    await expect(
      caller.circles.inviteLinks.create({ circleId: "circle-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
