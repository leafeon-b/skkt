import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { toUserId } from "@/server/domain/common/ids";
import { ForbiddenError } from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof toUserId> | null = toUserId("user-1"),
) => {
  const circleService = {
    getCircle: vi.fn(),
    createCircle: vi.fn(),
    renameCircle: vi.fn(),
    deleteCircle: vi.fn(),
    updateSessionEmailNotificationEnabled: vi.fn(),
  };

  const context: Context = {
    actorId: actorIdValue,
    clientIp: "1.2.3.4",
    circleService,
    circleMembershipService: {
      listByCircleId: vi.fn(),
      listByUserId: vi.fn(),
      addMembership: vi.fn(),
      changeMembershipRole: vi.fn(),
      withdrawMembership: vi.fn(),
      removeMembership: vi.fn(),
      transferOwnership: vi.fn(),
    },
    circleSessionService: {} as Context["circleSessionService"],
    circleSessionMembershipService:
      {} as Context["circleSessionMembershipService"],
    matchService: {} as Context["matchService"],
    userService: {} as Context["userService"],
    signupService: {} as Context["signupService"],
    circleInviteLinkService: {} as Context["circleInviteLinkService"],
    accessService: {} as Context["accessService"],
    userStatisticsService: {} as Context["userStatisticsService"],
    roundRobinScheduleService: {} as Context["roundRobinScheduleService"],
    holidayProvider: {} as Context["holidayProvider"],
    notificationPreferenceService:
      {} as Context["notificationPreferenceService"],
  };

  return { context, mocks: { circleService } };
};

describe("circles.updateSessionEmailNotification", () => {
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    ctx = createTestContext();
  });

  test("正常に設定を更新できる", async () => {
    ctx.mocks.circleService.updateSessionEmailNotificationEnabled.mockResolvedValue(
      undefined,
    );

    const caller = appRouter.createCaller(ctx.context);
    await caller.circles.updateSessionEmailNotification({
      circleId: "circle-1",
      enabled: false,
    });

    expect(
      ctx.mocks.circleService.updateSessionEmailNotificationEnabled,
    ).toHaveBeenCalledWith(
      toUserId("user-1"),
      expect.anything(),
      false,
    );
  });

  test("未認証ユーザーはUNAUTHORIZEDエラーになる", async () => {
    const unauthCtx = createTestContext(null);
    const caller = appRouter.createCaller(unauthCtx.context);

    await expect(
      caller.circles.updateSessionEmailNotification({
        circleId: "circle-1",
        enabled: false,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("権限のないユーザーはFORBIDDENエラーになる", async () => {
    ctx.mocks.circleService.updateSessionEmailNotificationEnabled.mockRejectedValue(
      new ForbiddenError(),
    );

    const caller = appRouter.createCaller(ctx.context);

    await expect(
      caller.circles.updateSessionEmailNotification({
        circleId: "circle-1",
        enabled: false,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
