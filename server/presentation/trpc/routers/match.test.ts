import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import {
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import {
  BadRequestError,
  ForbiddenError,
} from "@/server/domain/common/errors";

const createTestContext = (
  actorIdValue: ReturnType<typeof userId> | null = userId("user-1"),
) => {
  const matchService = {
    listByCircleSessionId: vi.fn(),
    getMatch: vi.fn(),
    recordMatch: vi.fn(),
    updateMatch: vi.fn(),
    deleteMatch: vi.fn(),
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
    matchService,
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
    userStatisticsService: {} as Context["userStatisticsService"],
    holidayProvider: {} as Context["holidayProvider"],
  };

  return { context, mocks: { matchService } };
};

const baseMatch = () => ({
  id: matchId("match-1"),
  circleSessionId: circleSessionId("session-1"),
  createdAt: new Date("2024-06-01T10:00:00Z"),
  player1Id: userId("player-1"),
  player2Id: userId("player-2"),
  outcome: "P1_WIN" as const,
  deletedAt: null,
});

describe("match tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    test("セッションの全対局一覧を取得できる", async () => {
      const { context, mocks } = createTestContext();
      const match = baseMatch();
      mocks.matchService.listByCircleSessionId.mockResolvedValueOnce([match]);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.list({
        circleSessionId: "session-1",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("match-1");
      expect(result[0].player1Id).toBe("player-1");
      expect(result[0].outcome).toBe("P1_WIN");
      expect(mocks.matchService.listByCircleSessionId).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        circleSessionId: circleSessionId("session-1"),
      });
    });

    test("空配列を返す（対局なし）", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.listByCircleSessionId.mockResolvedValueOnce([]);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.list({
        circleSessionId: "session-1",
      });

      expect(result).toEqual([]);
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.listByCircleSessionId.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.list({ circleSessionId: "session-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.list({ circleSessionId: "session-1" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("get", () => {
    test("対局1件を取得できる", async () => {
      const { context, mocks } = createTestContext();
      const match = baseMatch();
      mocks.matchService.getMatch.mockResolvedValueOnce(match);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.get({ matchId: "match-1" });

      expect(result.id).toBe("match-1");
      expect(result.circleSessionId).toBe("session-1");
      expect(result.player1Id).toBe("player-1");
      expect(result.player2Id).toBe("player-2");
      expect(mocks.matchService.getMatch).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        id: matchId("match-1"),
      });
    });

    test("存在しない対局 → NOT_FOUND", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.getMatch.mockResolvedValueOnce(null);

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.get({ matchId: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.getMatch.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.get({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.get({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("create", () => {
    test("対局を作成できる（outcome あり）", async () => {
      const { context, mocks } = createTestContext();
      const match = baseMatch();
      mocks.matchService.recordMatch.mockResolvedValueOnce(match);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.create({
        circleSessionId: "session-1",
        player1Id: "player-1",
        player2Id: "player-2",
        outcome: "P1_WIN",
      });

      expect(result.id).toBe("match-1");
      expect(result.outcome).toBe("P1_WIN");
      expect(mocks.matchService.recordMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: userId("user-1"),
          circleSessionId: circleSessionId("session-1"),
          player1Id: userId("player-1"),
          player2Id: userId("player-2"),
          outcome: "P1_WIN",
        }),
      );
    });

    test("対局を作成できる（outcome なし）", async () => {
      const { context, mocks } = createTestContext();
      const match = { ...baseMatch(), outcome: "UNKNOWN" as const };
      mocks.matchService.recordMatch.mockResolvedValueOnce(match);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.create({
        circleSessionId: "session-1",
        player1Id: "player-1",
        player2Id: "player-2",
      });

      expect(result.outcome).toBe("UNKNOWN");
      expect(mocks.matchService.recordMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: undefined,
        }),
      );
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.recordMatch.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.create({
          circleSessionId: "session-1",
          player1Id: "player-1",
          player2Id: "player-2",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("BadRequestError（プレイヤー不正）→ BAD_REQUEST", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.recordMatch.mockRejectedValueOnce(
        new BadRequestError("Players must be different"),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.create({
          circleSessionId: "session-1",
          player1Id: "player-1",
          player2Id: "player-1",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.create({
          circleSessionId: "session-1",
          player1Id: "player-1",
          player2Id: "player-2",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("update", () => {
    test("対局を更新できる（プレイヤー変更）", async () => {
      const { context, mocks } = createTestContext();
      const updated = {
        ...baseMatch(),
        player1Id: userId("player-3"),
        player2Id: userId("player-4"),
      };
      mocks.matchService.updateMatch.mockResolvedValueOnce(updated);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.update({
        matchId: "match-1",
        player1Id: "player-3",
        player2Id: "player-4",
      });

      expect(result.player1Id).toBe("player-3");
      expect(result.player2Id).toBe("player-4");
      expect(mocks.matchService.updateMatch).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        id: matchId("match-1"),
        player1Id: userId("player-3"),
        player2Id: userId("player-4"),
        outcome: undefined,
      });
    });

    test("対局を更新できる（outcome のみ変更）", async () => {
      const { context, mocks } = createTestContext();
      const updated = { ...baseMatch(), outcome: "DRAW" as const };
      mocks.matchService.updateMatch.mockResolvedValueOnce(updated);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.update({
        matchId: "match-1",
        outcome: "DRAW",
      });

      expect(result.outcome).toBe("DRAW");
      expect(mocks.matchService.updateMatch).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        id: matchId("match-1"),
        player1Id: undefined,
        player2Id: undefined,
        outcome: "DRAW",
      });
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.updateMatch.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.update({ matchId: "match-1", outcome: "DRAW" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("BadRequestError（削除済み対局）→ BAD_REQUEST", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.updateMatch.mockRejectedValueOnce(
        new BadRequestError("Match is deleted"),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.update({ matchId: "match-1", outcome: "DRAW" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.update({ matchId: "match-1", outcome: "DRAW" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("delete", () => {
    test("対局を論理削除できる", async () => {
      const { context, mocks } = createTestContext();
      const deleted = {
        ...baseMatch(),
        deletedAt: new Date("2024-06-02T00:00:00Z"),
      };
      mocks.matchService.deleteMatch.mockResolvedValueOnce(deleted);

      const caller = appRouter.createCaller(context);
      const result = await caller.matches.delete({ matchId: "match-1" });

      expect(result.deletedAt).toEqual(new Date("2024-06-02T00:00:00Z"));
      expect(mocks.matchService.deleteMatch).toHaveBeenCalledWith({
        actorId: userId("user-1"),
        id: matchId("match-1"),
      });
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.deleteMatch.mockRejectedValueOnce(
        new ForbiddenError(),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.delete({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("BadRequestError（削除済み対局）→ BAD_REQUEST", async () => {
      const { context, mocks } = createTestContext();
      mocks.matchService.deleteMatch.mockRejectedValueOnce(
        new BadRequestError("Match is already deleted"),
      );

      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.delete({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const { context } = createTestContext(null);
      const caller = appRouter.createCaller(context);

      await expect(
        caller.matches.delete({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
