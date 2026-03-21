import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import {
  toCircleId,
  toCircleSessionId,
  toUserId,
} from "@/server/domain/common/ids";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/presentation/providers/__tests__/helpers/create-mock-deps";

const ACTOR_ID = toUserId("user-1");
const SESSION_ID = toCircleSessionId("session-1");
const CIRCLE_ID = toCircleId("circle-1");

let mockDeps: MockDeps;

const buildContext = (actorId: ReturnType<typeof toUserId> | null = ACTOR_ID) =>
  createMockContext(actorId, mockDeps);

const setupRegisteredUser = () => {
  mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
};

const baseMembership = () => ({
  circleSessionId: SESSION_ID,
  userId: ACTOR_ID,
  role: CircleSessionRole.CircleSessionMember,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  deletedAt: null,
});

const baseSession = (overrides?: Record<string, unknown>) => ({
  id: SESSION_ID,
  circleId: CIRCLE_ID,
  title: "第1回例会",
  startsAt: new Date("2024-06-01T13:00:00Z"),
  endsAt: new Date("2024-06-01T17:00:00Z"),
  location: "部室",
  note: "",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

const baseCircle = () => ({
  id: CIRCLE_ID,
  name: "さくら将棋研究会",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  sessionEmailNotificationEnabled: true,
});

describe("userCircleSessionMembership tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  describe("list", () => {
    test("ユーザーのセッション参加一覧を取得できる（limit 指定あり）", async () => {
      // listByUserId needs:
      // 1. actorId === userId → OK
      // 2. accessService.canListOwnCircles → isRegisteredUser
      // 3. circleSessionRepository.listMembershipsByUserId → memberships
      // 4. circleSessionRepository.findByIds → sessions
      // 5. circleRepository.findByIds → circles (for names)
      setupRegisteredUser();
      mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
        baseMembership(),
      ]);
      mockDeps.circleSessionRepository.findByIds.mockResolvedValue([
        baseSession(),
      ]);
      mockDeps.circleRepository.findByIds.mockResolvedValue([baseCircle()]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.users.circleSessions.memberships.list({
        limit: 5,
      });

      expect(result).toHaveLength(1);
      expect(result[0].circleSessionId).toBe("session-1");
      expect(result[0].circleId).toBe("circle-1");
      expect(result[0].circleName).toBe("さくら将棋研究会");
      expect(result[0].title).toBe("第1回例会");
      expect(result[0].location).toBe("部室");
    });

    test("ユーザーのセッション参加一覧を取得できる（limit 省略）", async () => {
      setupRegisteredUser();
      mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
        baseMembership(),
      ]);
      mockDeps.circleSessionRepository.findByIds.mockResolvedValue([
        baseSession(),
      ]);
      mockDeps.circleRepository.findByIds.mockResolvedValue([baseCircle()]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.users.circleSessions.memberships.list({});

      expect(result).toHaveLength(1);
    });

    test("空配列を返す（参加なし）", async () => {
      setupRegisteredUser();
      mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.users.circleSessions.memberships.list({});

      expect(result).toEqual([]);
    });

    test("location が null の場合も正しく返す", async () => {
      setupRegisteredUser();
      mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
        baseMembership(),
      ]);
      mockDeps.circleSessionRepository.findByIds.mockResolvedValue([
        baseSession({ location: null }),
      ]);
      mockDeps.circleRepository.findByIds.mockResolvedValue([baseCircle()]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.users.circleSessions.memberships.list({});

      expect(result[0].location).toBeNull();
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // isRegisteredUser returns false → canListOwnCircles fails → ForbiddenError
      mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(false);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.users.circleSessions.memberships.list({}),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.users.circleSessions.memberships.list({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
