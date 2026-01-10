import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import type { Context } from "@/server/presentation/trpc/context";
import {
  circleId,
  circleSessionId,
  matchHistoryId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";

const createContext = () => {
  const circleService = {
    getCircle: vi.fn(),
    createCircle: vi.fn(),
    renameCircle: vi.fn(),
    deleteCircle: vi.fn(),
  };
  const circleParticipationService = {
    listByCircleId: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    changeParticipationRole: vi.fn(),
    removeParticipation: vi.fn(),
    transferOwnership: vi.fn(),
  };
  const circleSessionService = {
    listByCircleId: vi.fn(),
    getCircleSession: vi.fn(),
    createCircleSession: vi.fn(),
    rescheduleCircleSession: vi.fn(),
    updateCircleSessionDetails: vi.fn(),
    deleteCircleSession: vi.fn(),
  };
  const circleSessionParticipationService = {
    listParticipations: vi.fn(),
    addParticipation: vi.fn(),
    changeParticipationRole: vi.fn(),
    removeParticipation: vi.fn(),
    transferOwnership: vi.fn(),
  };
  const matchService = {
    listByCircleSessionId: vi.fn(),
    getMatch: vi.fn(),
    recordMatch: vi.fn(),
    updateMatch: vi.fn(),
    deleteMatch: vi.fn(),
  };
  const matchHistoryService = {
    listByMatchId: vi.fn(),
  };
  const userService = {
    getUser: vi.fn(),
    listUsers: vi.fn(),
  };

  const context: Context = {
    actorId: "user-1",
    circleService,
    circleParticipationService,
    circleSessionService,
    circleSessionParticipationService,
    matchService,
    matchHistoryService,
    userService,
    accessService: {} as Context["accessService"],
  };

  return {
    context,
    mocks: {
      circleService,
      circleParticipationService,
      circleSessionService,
      circleSessionParticipationService,
      matchService,
      matchHistoryService,
      userService,
    },
  };
};

describe("tRPC router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("circles.get はサークルを返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleService.getCircle.mockResolvedValueOnce({
      id: circleId("circle-1"),
      name: "Test Circle",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.get({ circleId: "circle-1" });

    expect(result.name).toBe("Test Circle");
  });

  test("circles.get は見つからないと NOT_FOUND", async () => {
    const { context, mocks } = createContext();
    mocks.circleService.getCircle.mockResolvedValueOnce(null);

    const caller = appRouter.createCaller(context);

    await expect(
      caller.circles.get({ circleId: "circle-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("circles.participations.add は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleParticipationService.addParticipation.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.participations.add({
      circleId: "circle-1",
      userId: "user-2",
      role: CircleRole.CircleMember,
    });

    expect(result).toBeUndefined();
    expect(
      mocks.circleParticipationService.addParticipation,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleId: circleId("circle-1"),
      userId: userId("user-2"),
      role: CircleRole.CircleMember,
    });
  });

  test("users.circles.participations.list は所属研究会一覧を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleParticipationService.listByUserId.mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        circleName: "Test Circle",
        role: CircleRole.CircleOwner,
      },
    ]);

    const caller = appRouter.createCaller(context);
    const result = await caller.users.circles.participations.list({});

    expect(result).toEqual([
      {
        circleId: "circle-1",
        circleName: "Test Circle",
        role: CircleRole.CircleOwner,
      },
    ]);
    expect(mocks.circleParticipationService.listByUserId).toHaveBeenCalledWith({
      actorId: "user-1",
      userId: userId("user-1"),
    });
  });

  test("circles.rename は更新後のサークルを返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleService.renameCircle.mockResolvedValueOnce({
      id: circleId("circle-1"),
      name: "Renamed Circle",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.rename({
      circleId: "circle-1",
      name: "Renamed Circle",
    });

    expect(result.name).toBe("Renamed Circle");
    expect(mocks.circleService.renameCircle).toHaveBeenCalledWith(
      "user-1",
      circleId("circle-1"),
      "Renamed Circle",
    );
  });

  test("circles.delete は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleService.deleteCircle.mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.delete({ circleId: "circle-1" });

    expect(result).toBeUndefined();
    expect(mocks.circleService.deleteCircle).toHaveBeenCalledWith(
      "user-1",
      circleId("circle-1"),
    );
  });

  test("circles.delete は権限エラーで FORBIDDEN", async () => {
    const { context, mocks } = createContext();
    mocks.circleService.deleteCircle.mockRejectedValueOnce(
      new Error("Forbidden"),
    );

    const caller = appRouter.createCaller(context);

    await expect(
      caller.circles.delete({ circleId: "circle-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("circleSessions.create は Date 入力を受け付ける", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionService.createCircleSession.mockResolvedValueOnce({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2025-02-01T09:00:00Z"),
      endsAt: new Date("2025-02-01T12:00:00Z"),
      location: null,
      note: "",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    await caller.circleSessions.create({
      circleId: "circle-1",
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2025-02-01T09:00:00Z"),
      endsAt: new Date("2025-02-01T12:00:00Z"),
      location: null,
      note: "",
    });

    const call =
      mocks.circleSessionService.createCircleSession.mock.calls[0][0];
    expect(call.startsAt).toBeInstanceOf(Date);
    expect(call.endsAt).toBeInstanceOf(Date);
  });

  test("circleSessions.delete は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionService.deleteCircleSession.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.delete({
      circleSessionId: "session-1",
    });

    expect(result).toBeUndefined();
    expect(mocks.circleSessionService.deleteCircleSession).toHaveBeenCalledWith(
      "user-1",
      circleSessionId("session-1"),
    );
  });

  test("circleSessions.update は日時の片側不足を拒否する", async () => {
    const { context } = createContext();
    const caller = appRouter.createCaller(context);

    await expect(
      caller.circleSessions.update({
        circleSessionId: "session-1",
        startsAt: new Date("2025-03-01T09:00:00Z"),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("matches.list は対局一覧を返す", async () => {
    const { context, mocks } = createContext();
    mocks.matchService.listByCircleSessionId.mockResolvedValueOnce([
      {
        id: matchId("match-1"),
        circleSessionId: circleSessionId("session-1"),
        order: 1,
        player1Id: userId("user-1"),
        player2Id: userId("user-2"),
        outcome: "P1_WIN",
        deletedAt: null,
      },
    ]);

    const caller = appRouter.createCaller(context);
    const result = await caller.matches.list({
      circleSessionId: "session-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("match-1");
  });

  test("matches.get は対局を返す", async () => {
    const { context, mocks } = createContext();
    mocks.matchService.getMatch.mockResolvedValueOnce({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      order: 1,
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P1_WIN",
      deletedAt: null,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.matches.get({ matchId: "match-1" });

    expect(result.id).toBe("match-1");
    expect(mocks.matchService.getMatch).toHaveBeenCalledWith({
      actorId: userId("user-1"),
      id: matchId("match-1"),
    });
  });

  test("matches.get は見つからないと NOT_FOUND", async () => {
    const { context, mocks } = createContext();
    mocks.matchService.getMatch.mockResolvedValueOnce(null);

    const caller = appRouter.createCaller(context);

    await expect(
      caller.matches.get({ matchId: "match-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("matches.create は作成した対局を返す", async () => {
    const { context, mocks } = createContext();
    mocks.matchService.recordMatch.mockResolvedValueOnce({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      order: 1,
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P1_WIN",
      deletedAt: null,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.matches.create({
      circleSessionId: "session-1",
      order: 1,
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "P1_WIN",
    });

    expect(result.id).toBe("match-1");
    expect(mocks.matchService.recordMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: userId("user-1"),
        circleSessionId: circleSessionId("session-1"),
        player1Id: userId("user-1"),
        player2Id: userId("user-2"),
        outcome: "P1_WIN",
      }),
    );
  });

  test("matches.update は片側のみのプレイヤー更新を拒否する", async () => {
    const { context } = createContext();
    const caller = appRouter.createCaller(context);

    await expect(
      caller.matches.update({
        matchId: "match-1",
        player1Id: "user-1",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("matches.update は更新後の対局を返す", async () => {
    const { context, mocks } = createContext();
    mocks.matchService.updateMatch.mockResolvedValueOnce({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      order: 1,
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P2_WIN",
      deletedAt: null,
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.matches.update({
      matchId: "match-1",
      outcome: "P2_WIN",
    });

    expect(result.outcome).toBe("P2_WIN");
    expect(mocks.matchService.updateMatch).toHaveBeenCalledWith({
      actorId: userId("user-1"),
      id: matchId("match-1"),
      player1Id: undefined,
      player2Id: undefined,
      outcome: "P2_WIN",
    });
  });

  test("matches.delete は削除済みの対局を返す", async () => {
    const { context, mocks } = createContext();
    mocks.matchService.deleteMatch.mockResolvedValueOnce({
      id: matchId("match-1"),
      circleSessionId: circleSessionId("session-1"),
      order: 1,
      player1Id: userId("user-1"),
      player2Id: userId("user-2"),
      outcome: "P1_WIN",
      deletedAt: new Date("2025-02-03T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.matches.delete({ matchId: "match-1" });

    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(mocks.matchService.deleteMatch).toHaveBeenCalledWith({
      actorId: userId("user-1"),
      id: matchId("match-1"),
    });
  });

  test("matches.history.list は履歴を返す", async () => {
    const { context, mocks } = createContext();
    mocks.matchHistoryService.listByMatchId.mockResolvedValueOnce([
      {
        id: matchHistoryId("history-1"),
        matchId: matchId("match-1"),
        editorId: userId("user-1"),
        action: "CREATE",
        createdAt: new Date("2025-02-02T00:00:00Z"),
        order: 1,
        player1Id: userId("user-1"),
        player2Id: userId("user-2"),
        outcome: "P1_WIN",
      },
    ]);

    const caller = appRouter.createCaller(context);
    const result = await caller.matches.history.list({ matchId: "match-1" });

    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("CREATE");
  });

  test("circleSessions.participations.updateRole は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionParticipationService.changeParticipationRole.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.participations.updateRole({
      circleSessionId: "session-1",
      userId: "user-2",
      role: CircleSessionRole.CircleSessionManager,
    });

    expect(result).toBeUndefined();
  });

  test("circleSessions.participations.transferOwnership は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionParticipationService.transferOwnership.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.participations.transferOwnership({
      circleSessionId: "session-1",
      fromUserId: "user-1",
      toUserId: "user-2",
    });

    expect(result).toBeUndefined();
  });
});
