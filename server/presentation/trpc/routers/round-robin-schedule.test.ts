import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import {
  toCircleId,
  toCircleSessionId,
  toRoundRobinScheduleId,
  toUserId,
} from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/presentation/providers/__tests__/helpers/create-mock-deps";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { User } from "@/server/domain/models/user/user";

const ACTOR_ID = toUserId("user-1");
const CIRCLE_ID = toCircleId("circle-1");
const SESSION_ID = toCircleSessionId("session-1");

let mockDeps: MockDeps;

const buildContext = (actorId: ReturnType<typeof toUserId> | null = ACTOR_ID) =>
  createMockContext(actorId, mockDeps);

const baseSchedule = (): RoundRobinSchedule => ({
  id: toRoundRobinScheduleId("schedule-1"),
  circleSessionId: SESSION_ID,
  rounds: [
    {
      roundNumber: 1,
      pairings: [
        { player1Id: toUserId("player-1"), player2Id: toUserId("player-2") },
      ],
    },
  ],
  totalMatchCount: 1,
  createdAt: new Date("2024-06-01T10:00:00Z"),
});

const baseUsers = (): User[] => [
  {
    id: toUserId("player-1"),
    name: "Player 1",
    email: "player1@example.com",
    image: null,
    hasCustomImage: false,
    profileVisibility: "PUBLIC",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: toUserId("player-2"),
    name: "Player 2",
    email: "player2@example.com",
    image: null,
    hasCustomImage: false,
    profileVisibility: "PUBLIC",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
];

const setupViewAccess = () => {
  // canViewRoundRobinSchedule checks both circle and session membership
  mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
    kind: "member",
    role: CircleRole.CircleMember,
  });
  // canViewUser for listUsers
  mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
};

const setupManageAccess = () => {
  // canManageRoundRobinSchedule checks session membership with Owner/Manager role
  mockDeps.authzRepository.findCircleSessionMembership.mockResolvedValue({
    kind: "member",
    role: CircleSessionRole.CircleSessionOwner,
  });
  // canViewUser for listUsers
  mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
};

describe("roundRobinSchedule tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  describe("get", () => {
    test("順番存在時: DTO形式で返却される", async () => {
      setupViewAccess();
      // getSchedule: roundRobinScheduleRepository.findByCircleSessionId → schedule
      mockDeps.roundRobinScheduleRepository.findByCircleSessionId.mockResolvedValue(
        baseSchedule(),
      );
      // listUsers for player info: userRepository.findByIds → users
      mockDeps.userRepository.findByIds.mockResolvedValue(baseUsers());

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.roundRobinSchedules.get({
        circleId: "circle-1",
        circleSessionId: "session-1",
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe("schedule-1");
      expect(result!.circleSessionId).toBe("session-1");
      expect(result!.totalMatchCount).toBe(1);
      expect(result!.rounds).toHaveLength(1);
      expect(result!.rounds[0].pairings[0].player1.id).toBe("player-1");
      expect(result!.rounds[0].pairings[0].player1.name).toBe("Player 1");
      expect(result!.rounds[0].pairings[0].player2.id).toBe("player-2");
    });

    test("順番未存在時: nullを返す", async () => {
      setupViewAccess();
      // roundRobinScheduleRepository.findByCircleSessionId defaults to null

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.roundRobinSchedules.get({
        circleId: "circle-1",
        circleSessionId: "session-1",
      });

      expect(result).toBeNull();
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // No circle or session membership → canViewRoundRobinSchedule fails
      // authzRepository defaults return { kind: "none" }

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.roundRobinSchedules.get({
          circleId: "circle-1",
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.roundRobinSchedules.get({
          circleId: "circle-1",
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("generate", () => {
    test("正常生成: DTO形式で返却される", async () => {
      setupManageAccess();
      // generateSchedule needs:
      // 1. circleSessionRepository.findById → session (for existence check)
      // 2. circleSessionRepository.listMemberships → members (for schedule generation)
      // 3. roundRobinScheduleRepository.deleteByCircleSessionId
      // 4. roundRobinScheduleRepository.save
      mockDeps.circleSessionRepository.findById.mockResolvedValue({
        id: SESSION_ID,
        circleId: CIRCLE_ID,
        title: "テスト",
        startsAt: new Date(),
        endsAt: new Date(),
        location: null,
        note: "",
        createdAt: new Date(),
      });
      mockDeps.circleSessionRepository.listMemberships.mockResolvedValue([
        {
          circleSessionId: SESSION_ID,
          userId: toUserId("player-1"),
          role: CircleSessionRole.CircleSessionMember,
          createdAt: new Date(),
          deletedAt: null,
        },
        {
          circleSessionId: SESSION_ID,
          userId: toUserId("player-2"),
          role: CircleSessionRole.CircleSessionMember,
          createdAt: new Date(),
          deletedAt: null,
        },
      ]);
      // listUsers for player info
      mockDeps.userRepository.findByIds.mockResolvedValue(baseUsers());

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.roundRobinSchedules.generate({
        circleSessionId: "session-1",
      });

      expect(result.circleSessionId).toBe("session-1");
      expect(result.rounds).toHaveLength(1);
      const playerIds = [
        result.rounds[0].pairings[0].player1.id,
        result.rounds[0].pairings[0].player2.id,
      ].sort();
      expect(playerIds).toEqual(["player-1", "player-2"]);
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // canManageRoundRobinSchedule fails (default: { kind: "none" })
      mockDeps.circleSessionRepository.findById.mockResolvedValue({
        id: SESSION_ID,
        circleId: CIRCLE_ID,
        title: "テスト",
        startsAt: new Date(),
        endsAt: new Date(),
        location: null,
        note: "",
        createdAt: new Date(),
      });

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.roundRobinSchedules.generate({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("BadRequestError → BAD_REQUEST", async () => {
      // Generate with < 2 participants → BadRequestError from domain
      setupManageAccess();
      mockDeps.circleSessionRepository.findById.mockResolvedValue({
        id: SESSION_ID,
        circleId: CIRCLE_ID,
        title: "テスト",
        startsAt: new Date(),
        endsAt: new Date(),
        location: null,
        note: "",
        createdAt: new Date(),
      });
      // Only 1 member → BadRequestError
      mockDeps.circleSessionRepository.listMemberships.mockResolvedValue([
        {
          circleSessionId: SESSION_ID,
          userId: toUserId("player-1"),
          role: CircleSessionRole.CircleSessionMember,
          createdAt: new Date(),
          deletedAt: null,
        },
      ]);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.roundRobinSchedules.generate({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.roundRobinSchedules.generate({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("delete", () => {
    test("正常削除: voidを返す", async () => {
      setupManageAccess();

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.roundRobinSchedules.delete({
        circleSessionId: "session-1",
      });

      expect(result).toBeUndefined();
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // canManageRoundRobinSchedule fails (default: { kind: "none" })

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.roundRobinSchedules.delete({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証: actorId null → UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.roundRobinSchedules.delete({
          circleSessionId: "session-1",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
