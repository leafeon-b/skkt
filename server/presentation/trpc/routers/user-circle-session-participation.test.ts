import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";
import { ForbiddenError } from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof userId> | null = userId("user-1"),
) => {
  const circleSessionParticipationService = {
    listParticipations: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    changeParticipationRole: vi.fn(),
    removeParticipation: vi.fn(),
    transferOwnership: vi.fn(),
    withdrawParticipation: vi.fn(),
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
    circleSessionParticipationService,
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
      getMe: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    },
    signupService: {
      signup: vi.fn(),
    },
    circleInviteLinkService: {
      createInviteLink: vi.fn(),
      getInviteLinkInfo: vi.fn(),
      redeemInviteLink: vi.fn(),
    },
    accessService: {} as Context["accessService"],
  };

  return { context, mocks: { circleSessionParticipationService } };
};

const baseSummary = (overrides?: Record<string, unknown>) => ({
  circleSessionId: circleSessionId("session-1"),
  circleId: circleId("circle-1"),
  circleName: "京大将棋研究会",
  title: "第1回例会",
  startsAt: new Date("2024-06-01T13:00:00Z"),
  endsAt: new Date("2024-06-01T17:00:00Z"),
  location: "部室",
  ...overrides,
});

describe("userCircleSessionParticipation tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    test("ユーザーのセッション参加一覧を取得できる（limit 指定あり）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionParticipationService.listByUserId.mockResolvedValueOnce(
        [baseSummary()],
      );

      const caller = appRouter.createCaller(context);
      const result =
        await caller.users.circleSessions.participations.list({ limit: 5 });

      expect(result).toHaveLength(1);
      expect(result[0].circleSessionId).toBe("session-1");
      expect(result[0].circleId).toBe("circle-1");
      expect(result[0].circleName).toBe("京大将棋研究会");
      expect(result[0].title).toBe("第1回例会");
      expect(result[0].location).toBe("部室");
      expect(
        mocks.circleSessionParticipationService.listByUserId,
      ).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        userId: userId("user-1"),
        limit: 5,
      });
    });

    test("ユーザーのセッション参加一覧を取得できる（limit 省略）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionParticipationService.listByUserId.mockResolvedValueOnce(
        [baseSummary()],
      );

      const caller = appRouter.createCaller(context);
      const result =
        await caller.users.circleSessions.participations.list({});

      expect(result).toHaveLength(1);
      expect(
        mocks.circleSessionParticipationService.listByUserId,
      ).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        userId: userId("user-1"),
        limit: undefined,
      });
    });

    test("空配列を返す（参加なし）", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionParticipationService.listByUserId.mockResolvedValueOnce(
        [],
      );

      const caller = appRouter.createCaller(context);
      const result =
        await caller.users.circleSessions.participations.list({});

      expect(result).toEqual([]);
    });

    test("location が null の場合も正しく返す", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionParticipationService.listByUserId.mockResolvedValueOnce(
        [baseSummary({ location: null })],
      );

      const caller = appRouter.createCaller(context);
      const result =
        await caller.users.circleSessions.participations.list({});

      expect(result[0].location).toBeNull();
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.circleSessionParticipationService.listByUserId.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circleSessions.participations.list({}),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.users.circleSessions.participations.list({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
