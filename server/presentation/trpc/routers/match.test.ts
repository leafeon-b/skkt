import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import {
  toCircleId,
  toCircleSessionId,
  toMatchId,
  toUserId,
} from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/test-utils/create-mock-deps";

const ACTOR_ID = toUserId("user-1");
const CIRCLE_ID = toCircleId("circle-1");
const SESSION_ID = toCircleSessionId("session-1");
const MATCH_ID = toMatchId("match-1");

const BASE_SESSION = {
  id: SESSION_ID,
  circleId: CIRCLE_ID,
  title: "テスト",
  startsAt: new Date("2024-06-01T10:00:00Z"),
  endsAt: new Date("2024-06-01T17:00:00Z"),
  location: null,
  note: "",
  createdAt: new Date("2024-01-01T00:00:00Z"),
};

const baseMatch = () => ({
  id: MATCH_ID,
  circleSessionId: SESSION_ID,
  createdAt: new Date("2024-06-01T10:00:00Z"),
  player1Id: toUserId("player-1"),
  player2Id: toUserId("player-2"),
  outcome: "P1_WIN" as const,
  deletedAt: null,
});

let mockDeps: MockDeps;

const buildContext = (actorId: ReturnType<typeof toUserId> | null = ACTOR_ID) =>
  createMockContext(actorId, mockDeps);

/** Set up authz for match operations (circle member = can view/record/edit/delete) */
const setupMatchAccess = () => {
  mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
    kind: "member",
    role: CircleRole.CircleMember,
  });
};

describe("match tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  describe("list", () => {
    test("セッションの全対局一覧を取得できる", async () => {
      setupMatchAccess();
      // listByCircleSessionId needs:
      // 1. circleSessionRepository.findById → session
      // 2. canViewMatch → circle/session membership
      // 3. matchRepository.listByCircleSessionId → matches
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);
      mockDeps.matchRepository.listByCircleSessionId.mockResolvedValue([
        baseMatch(),
      ]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.list({
        circleSessionId: "session-1",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("match-1");
      expect(result[0].player1Id).toBe("player-1");
      expect(result[0].outcome).toBe("P1_WIN");
    });

    test("空配列を返す（対局なし）", async () => {
      setupMatchAccess();
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);
      mockDeps.matchRepository.listByCircleSessionId.mockResolvedValue([]);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.list({
        circleSessionId: "session-1",
      });

      expect(result).toEqual([]);
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // No membership → canViewMatch fails
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.list({ circleSessionId: "session-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.matches.list({ circleSessionId: "session-1" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("get", () => {
    test("対局1件を取得できる", async () => {
      setupMatchAccess();
      // getMatch needs:
      // 1. matchRepository.findById → match
      // 2. circleSessionRepository.findById → session (to get circleId)
      // 3. canViewMatch
      mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.get({ matchId: "match-1" });

      expect(result.id).toBe("match-1");
      expect(result.circleSessionId).toBe("session-1");
      expect(result.player1Id).toBe("player-1");
      expect(result.player2Id).toBe("player-2");
    });

    test("存在しない対局 → NOT_FOUND", async () => {
      // matchRepository.findById defaults to null → NotFoundError in router
      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.get({ matchId: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // Match exists but no membership → canViewMatch fails
      mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.get({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.matches.get({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("create", () => {
    test("対局を作成できる（outcome あり）", async () => {
      setupMatchAccess();
      // recordMatch needs:
      // 1. circleSessionRepository.findById → session
      // 2. canRecordMatch → circle/session membership
      // 3. circleSessionRepository.areUsersSessionMembers → true
      // 4. matchRepository.save
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);
      mockDeps.circleSessionRepository.areUsersSessionMembers.mockResolvedValue(
        true,
      );

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.create({
        circleSessionId: "session-1",
        player1Id: "player-1",
        player2Id: "player-2",
        outcome: "P1_WIN",
      });

      expect(result.id).toBeDefined();
      expect(result.outcome).toBe("P1_WIN");
    });

    test("対局を作成できる（outcome なし）", async () => {
      setupMatchAccess();
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);
      mockDeps.circleSessionRepository.areUsersSessionMembers.mockResolvedValue(
        true,
      );

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.create({
        circleSessionId: "session-1",
        player1Id: "player-1",
        player2Id: "player-2",
      });

      expect(result.outcome).toBe("UNKNOWN");
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // No membership → canRecordMatch fails
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.create({
          circleSessionId: "session-1",
          player1Id: "player-1",
          player2Id: "player-2",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("同一プレイヤーID → BAD_REQUEST（Zodバリデーション）", async () => {
      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.create({
          circleSessionId: "session-1",
          player1Id: "player-1",
          player2Id: "player-1",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining(
          "player1Id and player2Id must be different",
        ),
      });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

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
      setupMatchAccess();
      // updateMatch needs:
      // 1. matchRepository.findById → match (not deleted)
      // 2. circleSessionRepository.findById → session
      // 3. canEditMatch → circle/session membership
      // 4. circleSessionRepository.areUsersSessionMembers → true (for player change)
      // 5. matchRepository.save
      mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);
      mockDeps.circleSessionRepository.areUsersSessionMembers.mockResolvedValue(
        true,
      );

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.update({
        matchId: "match-1",
        player1Id: "player-3",
        player2Id: "player-4",
      });

      expect(result.player1Id).toBe("player-3");
      expect(result.player2Id).toBe("player-4");
    });

    test("対局を更新できる（outcome のみ変更）", async () => {
      setupMatchAccess();
      mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.update({
        matchId: "match-1",
        outcome: "DRAW",
      });

      expect(result.outcome).toBe("DRAW");
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // No membership → canEditMatch fails
      mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.update({ matchId: "match-1", outcome: "DRAW" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("BadRequestError（削除済み対局）→ BAD_REQUEST", async () => {
      setupMatchAccess();
      mockDeps.matchRepository.findById.mockResolvedValue({
        ...baseMatch(),
        deletedAt: new Date("2024-06-02T00:00:00Z"),
      });

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.update({ matchId: "match-1", outcome: "DRAW" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.matches.update({ matchId: "match-1", outcome: "DRAW" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("delete", () => {
    test("対局を論理削除できる", async () => {
      setupMatchAccess();
      // deleteMatch needs:
      // 1. matchRepository.findById → match (not deleted)
      // 2. circleSessionRepository.findById → session
      // 3. canDeleteMatch → circle/session membership
      // 4. matchRepository.save (with deletedAt set)
      mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.matches.delete({ matchId: "match-1" });

      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // No membership → canDeleteMatch fails
      mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
      mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.delete({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("BadRequestError（削除済み対局）→ BAD_REQUEST", async () => {
      setupMatchAccess();
      mockDeps.matchRepository.findById.mockResolvedValue({
        ...baseMatch(),
        deletedAt: new Date("2024-06-02T00:00:00Z"),
      });

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.matches.delete({ matchId: "match-1" }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Match is deleted",
      });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.matches.delete({ matchId: "match-1" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
