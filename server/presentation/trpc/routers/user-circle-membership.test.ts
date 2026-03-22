import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/test-utils/create-mock-deps";

const ACTOR_ID = toUserId("user-1");

let mockDeps: MockDeps;

const buildContext = (actorId: ReturnType<typeof toUserId> | null = ACTOR_ID) =>
  createMockContext(actorId, mockDeps);

describe("userCircleMembership tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  describe("list", () => {
    test("ユーザーの研究会参加一覧を取得できる", async () => {
      // listByUserId needs:
      // 1. actorId === userId (self-access only) → OK since router passes actorId as userId
      // 2. accessService.canListOwnCircles → authzRepository.isRegisteredUser → true
      // 3. circleRepository.listMembershipsByUserId → memberships
      // 4. circleRepository.findByIds → circles (for names)
      mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
      mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([
        {
          circleId: toCircleId("circle-1"),
          userId: ACTOR_ID,
          role: CircleRole.CircleMember,
          createdAt: new Date(),
          deletedAt: null,
        },
        {
          circleId: toCircleId("circle-2"),
          userId: ACTOR_ID,
          role: CircleRole.CircleOwner,
          createdAt: new Date(),
          deletedAt: null,
        },
      ]);
      mockDeps.circleRepository.findByIds.mockResolvedValue([
        {
          id: toCircleId("circle-1"),
          name: "さくら将棋研究会",
          createdAt: new Date(),
          sessionEmailNotificationEnabled: true,
        },
        {
          id: toCircleId("circle-2"),
          name: "テスト研究会",
          createdAt: new Date(),
          sessionEmailNotificationEnabled: true,
        },
      ]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.users.circles.memberships.list({});

      expect(result).toHaveLength(2);
      expect(result[0].circleId).toBe("circle-1");
      expect(result[0].circleName).toBe("さくら将棋研究会");
      expect(result[0].role).toBe("CircleMember");
      expect(result[1].circleId).toBe("circle-2");
      expect(result[1].role).toBe("CircleOwner");
    });

    test("空配列を返す（参加なし）", async () => {
      mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
      mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.users.circles.memberships.list({});

      expect(result).toEqual([]);
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // isRegisteredUser returns false → canListOwnCircles fails → ForbiddenError
      mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(false);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.users.circles.memberships.list({}),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.users.circles.memberships.list({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
