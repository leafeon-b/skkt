import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import {
  createMockDeps,
  createServiceContainer,
  toServiceContainerDeps,
  type MockDeps,
} from "@/server/presentation/providers/__tests__/helpers/create-mock-deps";

const ACTOR_ID = toUserId("user-1");
const CIRCLE_ID = toCircleId("circle-1");

const BASE_CIRCLE = {
  id: CIRCLE_ID,
  name: "テスト研究会",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  sessionEmailNotificationEnabled: true,
};

let mockDeps: MockDeps;

const buildContext = (actorId: ReturnType<typeof toUserId> | null = ACTOR_ID) => {
  const services = createServiceContainer(toServiceContainerDeps(mockDeps));
  return { actorId, clientIp: "1.2.3.4", ...services };
};

describe("circles.updateSessionEmailNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  test("正常に設定を更新できる", async () => {
    mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);
    mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
      kind: "member",
      role: CircleRole.CircleOwner,
    });

    const caller = appRouter.createCaller(buildContext());
    await caller.circles.updateSessionEmailNotification({
      circleId: "circle-1",
      enabled: false,
    });

    expect(mockDeps.circleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ sessionEmailNotificationEnabled: false }),
    );
  });

  test("未認証ユーザーはUNAUTHORIZEDエラーになる", async () => {
    const caller = appRouter.createCaller(buildContext(null));

    await expect(
      caller.circles.updateSessionEmailNotification({
        circleId: "circle-1",
        enabled: false,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("権限のないユーザーはFORBIDDENエラーになる", async () => {
    mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);
    // authzRepository.findCircleMembership defaults to { kind: "none" }

    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.circles.updateSessionEmailNotification({
        circleId: "circle-1",
        enabled: false,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
