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

describe("circle-session tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  describe("create", () => {
    test("空のセッション名 → BAD_REQUEST（Zodバリデーション）", async () => {
      // Zod validation fires before service is called, so no repo setup needed
      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.circleSessions.create({
          circleId: "circle-1",
          title: "",
          startsAt: new Date("2024-06-01T10:00:00Z"),
          endsAt: new Date("2024-06-01T12:00:00Z"),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });

      expect(
        mockDeps.circleSessionRepository.save,
      ).not.toHaveBeenCalled();
    });

    test("BadRequestError（開始日時が終了日時より後）→ BAD_REQUEST", async () => {
      // createCircleSession needs:
      // 1. circleRepository.findById → circle exists
      // 2. accessService.canCreateCircleSession → authzRepository.findCircleMembership → CircleOwner/Manager
      // 3. createCircleSession domain function validates startsAt <= endsAt
      mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);
      mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
        kind: "member",
        role: CircleRole.CircleOwner,
      });

      const caller = appRouter.createCaller(buildContext());

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
    });
  });
});
