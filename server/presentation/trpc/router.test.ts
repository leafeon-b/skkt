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
    listByUserId: vi.fn(),
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
  const signupService = {
    signup: vi.fn(),
  };
  const circleInviteLinkService = {
    createInviteLink: vi.fn(),
    getInviteLinkInfo: vi.fn(),
    redeemInviteLink: vi.fn(),
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
    signupService,
    circleInviteLinkService,
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

  test("users.circleSessions.participations.list は参加回一覧を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionParticipationService.listByUserId.mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        circleId: circleId("circle-1"),
        circleName: "Test Circle",
        title: "第1回 研究会",
        startsAt: new Date("2025-01-01T10:00:00Z"),
        endsAt: new Date("2025-01-01T12:00:00Z"),
        location: null,
      },
    ]);

    const caller = appRouter.createCaller(context);
    const result = await caller.users.circleSessions.participations.list({
      limit: 3,
    });

    expect(result).toEqual([
      {
        circleSessionId: "session-1",
        circleId: "circle-1",
        circleName: "Test Circle",
        title: "第1回 研究会",
        startsAt: new Date("2025-01-01T10:00:00Z"),
        endsAt: new Date("2025-01-01T12:00:00Z"),
        location: null,
      },
    ]);
    expect(
      mocks.circleSessionParticipationService.listByUserId,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      userId: userId("user-1"),
      limit: 3,
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
    const result = await caller.circleSessions.participations.transferOwnership(
      {
        circleSessionId: "session-1",
        fromUserId: "user-1",
        toUserId: "user-2",
      },
    );

    expect(result).toBeUndefined();
  });

  // ========================================
  // Step 1: circles.create テスト
  // ========================================

  test("circles.create は作成したサークルを返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleService.createCircle.mockResolvedValueOnce({
      id: circleId("circle-new"),
      name: "新しい研究会",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.create({ name: "新しい研究会" });

    expect(result.name).toBe("新しい研究会");
    expect(mocks.circleService.createCircle).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        name: "新しい研究会",
      }),
    );
  });

  // ========================================
  // Step 2: circles.participations 系テスト
  // ========================================

  test("circles.participations.list は参加者一覧を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleParticipationService.listByCircleId.mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        displayName: "テストユーザー",
        role: CircleRole.CircleOwner,
      },
      {
        circleId: circleId("circle-1"),
        userId: userId("user-2"),
        displayName: "メンバー",
        role: CircleRole.CircleMember,
      },
    ]);

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.participations.list({
      circleId: "circle-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe("user-1");
    expect(result[0].role).toBe(CircleRole.CircleOwner);
    expect(
      mocks.circleParticipationService.listByCircleId,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleId: circleId("circle-1"),
    });
  });

  test("circles.participations.updateRole は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleParticipationService.changeParticipationRole.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.participations.updateRole({
      circleId: "circle-1",
      userId: "user-2",
      role: CircleRole.CircleManager,
    });

    expect(result).toBeUndefined();
    expect(
      mocks.circleParticipationService.changeParticipationRole,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleId: circleId("circle-1"),
      userId: userId("user-2"),
      role: CircleRole.CircleManager,
    });
  });

  test("circles.participations.remove は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleParticipationService.removeParticipation.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.participations.remove({
      circleId: "circle-1",
      userId: "user-2",
    });

    expect(result).toBeUndefined();
    expect(
      mocks.circleParticipationService.removeParticipation,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleId: circleId("circle-1"),
      userId: userId("user-2"),
    });
  });

  test("circles.participations.transferOwnership は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleParticipationService.transferOwnership.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circles.participations.transferOwnership({
      circleId: "circle-1",
      fromUserId: "user-1",
      toUserId: "user-2",
    });

    expect(result).toBeUndefined();
    expect(
      mocks.circleParticipationService.transferOwnership,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleId: circleId("circle-1"),
      fromUserId: userId("user-1"),
      toUserId: userId("user-2"),
    });
  });

  // ========================================
  // Step 3: circleSessions 系テスト
  // ========================================

  test("circleSessions.list はセッション一覧を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionService.listByCircleId.mockResolvedValueOnce([
      {
        id: circleSessionId("session-1"),
        circleId: circleId("circle-1"),
        title: "第1回 研究会",
        startsAt: new Date("2025-02-01T09:00:00Z"),
        endsAt: new Date("2025-02-01T12:00:00Z"),
        location: "会議室A",
        note: "",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
      {
        id: circleSessionId("session-2"),
        circleId: circleId("circle-1"),
        title: "第2回 研究会",
        startsAt: new Date("2025-03-01T09:00:00Z"),
        endsAt: new Date("2025-03-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.list({ circleId: "circle-1" });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("session-1");
    expect(result[0].title).toBe("第1回 研究会");
    expect(result[1].id).toBe("session-2");
    expect(mocks.circleSessionService.listByCircleId).toHaveBeenCalledWith(
      "user-1",
      "circle-1",
    );
  });

  test("circleSessions.get はセッションを返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionService.getCircleSession.mockResolvedValueOnce({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      title: "第1回 研究会",
      startsAt: new Date("2025-02-01T09:00:00Z"),
      endsAt: new Date("2025-02-01T12:00:00Z"),
      location: "会議室A",
      note: "メモ",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.get({
      circleSessionId: "session-1",
    });

    expect(result.id).toBe("session-1");
    expect(result.title).toBe("第1回 研究会");
    expect(mocks.circleSessionService.getCircleSession).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
  });

  test("circleSessions.get は見つからないと NOT_FOUND", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionService.getCircleSession.mockResolvedValueOnce(null);

    const caller = appRouter.createCaller(context);

    await expect(
      caller.circleSessions.get({ circleSessionId: "session-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  // ========================================
  // Step 4: circleSessions.participations 系テスト
  // ========================================

  test("circleSessions.participations.list は参加者一覧を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionParticipationService.listParticipations.mockResolvedValueOnce(
      [
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-1"),
          displayName: "オーナー",
          role: CircleSessionRole.CircleSessionOwner,
        },
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-2"),
          displayName: "メンバー",
          role: CircleSessionRole.CircleSessionMember,
        },
      ],
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.participations.list({
      circleSessionId: "session-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe("user-1");
    expect(result[0].role).toBe(CircleSessionRole.CircleSessionOwner);
    expect(
      mocks.circleSessionParticipationService.listParticipations,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleSessionId: circleSessionId("session-1"),
    });
  });

  test("circleSessions.participations.add は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionParticipationService.addParticipation.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.participations.add({
      circleSessionId: "session-1",
      userId: "user-3",
      role: CircleSessionRole.CircleSessionMember,
    });

    expect(result).toBeUndefined();
    expect(
      mocks.circleSessionParticipationService.addParticipation,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-3"),
      role: CircleSessionRole.CircleSessionMember,
    });
  });

  test("circleSessions.participations.remove は void を返す", async () => {
    const { context, mocks } = createContext();
    mocks.circleSessionParticipationService.removeParticipation.mockResolvedValueOnce(
      undefined,
    );

    const caller = appRouter.createCaller(context);
    const result = await caller.circleSessions.participations.remove({
      circleSessionId: "session-1",
      userId: "user-3",
    });

    expect(result).toBeUndefined();
    expect(
      mocks.circleSessionParticipationService.removeParticipation,
    ).toHaveBeenCalledWith({
      actorId: "user-1",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-3"),
    });
  });

  // ========================================
  // Step 5: users 系テスト
  // ========================================

  test("users.get はユーザーを返す", async () => {
    const { context, mocks } = createContext();
    mocks.userService.getUser.mockResolvedValueOnce({
      id: userId("user-2"),
      name: "テストユーザー",
      email: "test@example.com",
      image: null,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });

    const caller = appRouter.createCaller(context);
    const result = await caller.users.get({ userId: "user-2" });

    expect(result.id).toBe("user-2");
    expect(result.name).toBe("テストユーザー");
    expect(mocks.userService.getUser).toHaveBeenCalledWith("user-1", "user-2");
  });

  test("users.get は見つからないと NOT_FOUND", async () => {
    const { context, mocks } = createContext();
    mocks.userService.getUser.mockResolvedValueOnce(null);

    const caller = appRouter.createCaller(context);

    await expect(
      caller.users.get({ userId: "user-not-found" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("users.list はユーザー一覧を返す", async () => {
    const { context, mocks } = createContext();
    mocks.userService.listUsers.mockResolvedValueOnce([
      {
        id: userId("user-1"),
        name: "ユーザー1",
        email: "user1@example.com",
        image: null,
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
      {
        id: userId("user-2"),
        name: "ユーザー2",
        email: "user2@example.com",
        image: null,
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);

    const caller = appRouter.createCaller(context);
    const result = await caller.users.list({
      userIds: ["user-1", "user-2"],
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("user-1");
    expect(result[1].id).toBe("user-2");
    expect(mocks.userService.listUsers).toHaveBeenCalledWith("user-1", [
      "user-1",
      "user-2",
    ]);
  });

  // ========================================
  // 未実装プロシージャのテスト
  // ========================================

  test("users.memberships.list は Not implemented を返す", async () => {
    const { context } = createContext();
    const caller = appRouter.createCaller(context);

    await expect(
      caller.users.memberships.list({ userId: "user-1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

});
