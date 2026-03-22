import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import {
  toCircleId,
  toCircleSessionId,
  toMatchId,
  toUserId,
} from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/test-utils/create-mock-deps";

const ACTOR_ID = toUserId("user-1");
const CIRCLE_ID = toCircleId("circle-1");
const SESSION_ID = toCircleSessionId("session-1");
const MATCH_ID = toMatchId("match-1");
const NOW = new Date("2025-01-01T00:00:00Z");

let mockDeps: MockDeps;

const buildContext = () => createMockContext(ACTOR_ID, mockDeps);

const BASE_CIRCLE = {
  id: CIRCLE_ID,
  name: "Test Circle",
  createdAt: NOW,
  sessionEmailNotificationEnabled: true,
};

const BASE_SESSION = {
  id: SESSION_ID,
  circleId: CIRCLE_ID,
  title: "第1回 研究会",
  startsAt: new Date("2025-02-01T09:00:00Z"),
  endsAt: new Date("2025-02-01T12:00:00Z"),
  location: null as string | null,
  note: "",
  createdAt: NOW,
};

const baseMatch = () => ({
  id: MATCH_ID,
  circleSessionId: SESSION_ID,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  player1Id: toUserId("user-1"),
  player2Id: toUserId("user-2"),
  outcome: "P1_WIN" as const,
  deletedAt: null,
});

/** Set up authz as registered user */
const setupRegisteredUser = () => {
  mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
};

/** Set up authz as circle member */
const setupCircleMember = (role: CircleRole = CircleRole.CircleOwner) => {
  setupRegisteredUser();
  mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
    kind: "member",
    role,
  });
};

/** Set up authz as circle session member */
const setupSessionMember = (
  role: CircleSessionRole = CircleSessionRole.CircleSessionOwner,
) => {
  setupRegisteredUser();
  mockDeps.authzRepository.findCircleSessionMembership.mockResolvedValue({
    kind: "member",
    role,
  });
};

/** Set up authz as both circle and session member */
const setupCircleAndSessionMember = () => {
  setupCircleMember(CircleRole.CircleOwner);
  setupSessionMember(CircleSessionRole.CircleSessionOwner);
};

/** Set up circleRepository.findById to return BASE_CIRCLE (with optional overrides) */
const setupCircleFound = (
  override?: Partial<typeof BASE_CIRCLE>,
) => {
  mockDeps.circleRepository.findById.mockResolvedValue({
    ...BASE_CIRCLE,
    ...override,
  });
};

/** Set up circleSessionRepository.findById to return BASE_SESSION (with optional overrides) */
const setupSessionFound = (
  override?: Partial<typeof BASE_SESSION>,
) => {
  mockDeps.circleSessionRepository.findById.mockResolvedValue({
    ...BASE_SESSION,
    ...override,
  });
};

/** Default circle memberships: Owner(ACTOR_ID) + Member(user-2) */
const DEFAULT_CIRCLE_MEMBERSHIPS = [
  {
    circleId: CIRCLE_ID,
    userId: ACTOR_ID,
    role: CircleRole.CircleOwner,
    createdAt: NOW,
    deletedAt: null,
  },
  {
    circleId: CIRCLE_ID,
    userId: toUserId("user-2"),
    role: CircleRole.CircleMember,
    createdAt: NOW,
    deletedAt: null,
  },
];

/** Set up circleRepository.listMembershipsByCircleId */
const setupCircleMemberships = (
  members = DEFAULT_CIRCLE_MEMBERSHIPS,
) => {
  mockDeps.circleRepository.listMembershipsByCircleId.mockResolvedValue(
    members,
  );
};

/** Default session memberships: Owner(ACTOR_ID) + Member(user-2) */
const DEFAULT_SESSION_MEMBERSHIPS = [
  {
    circleSessionId: SESSION_ID,
    userId: ACTOR_ID,
    role: CircleSessionRole.CircleSessionOwner,
    createdAt: NOW,
    deletedAt: null,
  },
  {
    circleSessionId: SESSION_ID,
    userId: toUserId("user-2"),
    role: CircleSessionRole.CircleSessionMember,
    createdAt: NOW,
    deletedAt: null,
  },
];

/** Set up circleSessionRepository.listMemberships */
const setupSessionMemberships = (
  members = DEFAULT_SESSION_MEMBERSHIPS,
) => {
  mockDeps.circleSessionRepository.listMemberships.mockResolvedValue(members);
};

describe("tRPC router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  test("circles.get はサークルを返す", async () => {
    setupCircleMember();
    setupCircleFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.get({ circleId: "circle-1" });

    expect(result.name).toBe("Test Circle");
  });

  test("circles.get は見つからないと NOT_FOUND", async () => {
    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.circles.get({ circleId: "circle-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("circles.memberships.add は void を返す", async () => {
    setupCircleMember();
    setupCircleFound();
    setupCircleMemberships([DEFAULT_CIRCLE_MEMBERSHIPS[0]]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.memberships.add({
      circleId: "circle-1",
      userId: "user-2",
      role: CircleRole.CircleMember,
    });

    expect(result).toBeUndefined();
  });

  test("users.circles.memberships.list は所属研究会一覧を返す", async () => {
    setupRegisteredUser();
    mockDeps.circleRepository.listMembershipsByUserId.mockResolvedValue([
      {
        circleId: CIRCLE_ID,
        userId: ACTOR_ID,
        role: CircleRole.CircleOwner,
        createdAt: NOW,
        deletedAt: null,
      },
    ]);
    mockDeps.circleRepository.findByIds.mockResolvedValue([BASE_CIRCLE]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.users.circles.memberships.list({});

    expect(result).toEqual([
      {
        circleId: "circle-1",
        circleName: "Test Circle",
        role: CircleRole.CircleOwner,
      },
    ]);
  });

  test("users.circleSessions.memberships.list は参加回一覧を返す", async () => {
    setupRegisteredUser();
    mockDeps.circleSessionRepository.listMembershipsByUserId.mockResolvedValue([
      {
        circleSessionId: SESSION_ID,
        userId: ACTOR_ID,
        role: CircleSessionRole.CircleSessionOwner,
        createdAt: NOW,
        deletedAt: null,
      },
    ]);
    mockDeps.circleSessionRepository.findByIds.mockResolvedValue([
      BASE_SESSION,
    ]);
    mockDeps.circleRepository.findByIds.mockResolvedValue([BASE_CIRCLE]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.users.circleSessions.memberships.list({
      limit: 3,
    });

    expect(result).toEqual([
      {
        circleSessionId: "session-1",
        circleId: "circle-1",
        circleName: "Test Circle",
        title: "第1回 研究会",
        startsAt: new Date("2025-02-01T09:00:00Z"),
        endsAt: new Date("2025-02-01T12:00:00Z"),
        location: null,
      },
    ]);
  });

  test("circles.rename は更新後のサークルを返す", async () => {
    setupCircleMember();
    setupCircleFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.rename({
      circleId: "circle-1",
      name: "Renamed Circle",
    });

    expect(result.name).toBe("Renamed Circle");
  });

  test("circles.delete は void を返す", async () => {
    setupCircleMember();
    setupCircleFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.delete({ circleId: "circle-1" });

    expect(result).toBeUndefined();
  });

  test("circles.delete は権限エラーで FORBIDDEN", async () => {
    setupCircleMember(CircleRole.CircleMember);
    setupCircleFound();

    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.circles.delete({ circleId: "circle-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("circleSessions.create は Date 入力を受け付ける", async () => {
    setupCircleMember(CircleRole.CircleOwner);
    setupCircleFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.create({
      circleId: "circle-1",
      title: "第1回 研究会",
      startsAt: new Date("2025-02-01T09:00:00Z"),
      endsAt: new Date("2025-02-01T12:00:00Z"),
      location: null,
      note: "",
    });

    expect(result.startsAt).toBeInstanceOf(Date);
    expect(result.endsAt).toBeInstanceOf(Date);
  });

  test("circleSessions.delete は void を返す", async () => {
    setupSessionMember(CircleSessionRole.CircleSessionOwner);
    setupSessionFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.delete({
      circleSessionId: "session-1",
    });

    expect(result).toBeUndefined();
  });

  test("circleSessions.update は日時の片側不足を拒否する", async () => {
    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.circleSessions.update({
        circleSessionId: "session-1",
        startsAt: new Date("2025-03-01T09:00:00Z"),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("matches.list は対局一覧を返す", async () => {
    setupCircleMember(CircleRole.CircleMember);
    setupSessionFound();
    mockDeps.matchRepository.listByCircleSessionId.mockResolvedValue([
      baseMatch(),
    ]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.matches.list({
      circleSessionId: "session-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("match-1");
  });

  test("matches.get は対局を返す", async () => {
    setupCircleMember(CircleRole.CircleMember);
    mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
    setupSessionFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.matches.get({ matchId: "match-1" });

    expect(result.id).toBe("match-1");
  });

  test("matches.get は見つからないと NOT_FOUND", async () => {
    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.matches.get({ matchId: "match-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("matches.create は作成した対局を返す", async () => {
    setupCircleMember(CircleRole.CircleMember);
    setupSessionFound();
    mockDeps.circleSessionRepository.areUsersSessionMembers.mockResolvedValue(
      true,
    );

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.matches.create({
      circleSessionId: "session-1",
      player1Id: "user-1",
      player2Id: "user-2",
      outcome: "P1_WIN",
    });

    expect(result.id).toBeDefined();
    expect(result.outcome).toBe("P1_WIN");
  });

  test("matches.update は片側のみのプレイヤー更新を拒否する", async () => {
    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.matches.update({
        matchId: "match-1",
        player1Id: "user-1",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("matches.update は更新後の対局を返す", async () => {
    setupCircleMember(CircleRole.CircleMember);
    mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
    setupSessionFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.matches.update({
      matchId: "match-1",
      outcome: "P2_WIN",
    });

    expect(result.outcome).toBe("P2_WIN");
  });

  test("matches.delete は削除済みの対局を返す", async () => {
    setupCircleMember(CircleRole.CircleMember);
    mockDeps.matchRepository.findById.mockResolvedValue(baseMatch());
    setupSessionFound();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.matches.delete({ matchId: "match-1" });

    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  test("circleSessions.memberships.updateRole は void を返す", async () => {
    setupSessionMember(CircleSessionRole.CircleSessionOwner);
    setupSessionFound();
    setupSessionMemberships();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.memberships.updateRole({
      circleSessionId: "session-1",
      userId: "user-2",
      role: CircleSessionRole.CircleSessionManager,
    });

    expect(result).toBeUndefined();
  });

  test("circleSessions.memberships.transferOwnership は void を返す", async () => {
    setupSessionMember(CircleSessionRole.CircleSessionOwner);
    setupSessionFound();
    setupSessionMemberships();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.memberships.transferOwnership({
      circleSessionId: "session-1",
      fromUserId: "user-1",
      toUserId: "user-2",
    });

    expect(result).toBeUndefined();
  });

  // ========================================
  // Step 1: circles.create テスト
  // ========================================

  test("circles.create は作成したサークルを返す", async () => {
    setupRegisteredUser();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.create({ name: "新しい研究会" });

    expect(result.name).toBe("新しい研究会");
  });

  // ========================================
  // Step 2: circles.memberships 系テスト
  // ========================================

  test("circles.memberships.list は参加者一覧を返す", async () => {
    setupCircleMember();
    setupCircleFound();
    setupCircleMemberships();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.memberships.list({
      circleId: "circle-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe("user-1");
    expect(result[0].role).toBe(CircleRole.CircleOwner);
  });

  test("circles.memberships.updateRole は void を返す", async () => {
    setupCircleMember();
    setupCircleFound();
    setupCircleMemberships();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.memberships.updateRole({
      circleId: "circle-1",
      userId: "user-2",
      role: CircleRole.CircleManager,
    });

    expect(result).toBeUndefined();
  });

  test("circles.memberships.remove は void を返す", async () => {
    setupCircleMember();
    setupCircleFound();
    setupCircleMemberships();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.memberships.remove({
      circleId: "circle-1",
      userId: "user-2",
    });

    expect(result).toBeUndefined();
  });

  test("circles.memberships.transferOwnership は void を返す", async () => {
    setupCircleMember();
    setupCircleFound();
    setupCircleMemberships();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.memberships.transferOwnership({
      circleId: "circle-1",
      fromUserId: "user-1",
      toUserId: "user-2",
    });

    expect(result).toBeUndefined();
  });

  // ========================================
  // Step 3: circleSessions 系テスト
  // ========================================

  test("circleSessions.list はセッション一覧を返す", async () => {
    setupCircleMember();
    setupCircleFound();
    mockDeps.circleSessionRepository.listByCircleId.mockResolvedValue([
      BASE_SESSION,
      {
        id: toCircleSessionId("session-2"),
        circleId: CIRCLE_ID,
        title: "第2回 研究会",
        startsAt: new Date("2025-03-01T09:00:00Z"),
        endsAt: new Date("2025-03-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.list({ circleId: "circle-1" });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("session-1");
    expect(result[0].title).toBe("第1回 研究会");
    expect(result[1].id).toBe("session-2");
  });

  test("circleSessions.get はセッションを返す", async () => {
    setupCircleAndSessionMember();
    setupSessionFound({ location: "会議室A", note: "メモ" });

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.get({
      circleSessionId: "session-1",
    });

    expect(result.id).toBe("session-1");
    expect(result.title).toBe("第1回 研究会");
  });

  test("circleSessions.get は見つからないと NOT_FOUND", async () => {
    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.circleSessions.get({ circleSessionId: "session-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  // ========================================
  // Step 4: circleSessions.memberships 系テスト
  // ========================================

  test("circleSessions.memberships.list は参加者一覧を返す", async () => {
    setupCircleAndSessionMember();
    setupSessionFound();
    setupSessionMemberships();

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.memberships.list({
      circleSessionId: "session-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe("user-1");
    expect(result[0].role).toBe(CircleSessionRole.CircleSessionOwner);
  });

  test("circleSessions.memberships.add は void を返す", async () => {
    setupSessionMember(CircleSessionRole.CircleSessionOwner);
    setupSessionFound();
    mockDeps.circleRepository.findMembershipByCircleAndUser.mockResolvedValue({
      circleId: CIRCLE_ID,
      userId: toUserId("user-3"),
      role: CircleRole.CircleMember,
      createdAt: NOW,
      deletedAt: null,
    });
    setupSessionMemberships([DEFAULT_SESSION_MEMBERSHIPS[0]]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.memberships.add({
      circleSessionId: "session-1",
      userId: "user-3",
      role: CircleSessionRole.CircleSessionMember,
    });

    expect(result).toBeUndefined();
  });

  test("circleSessions.memberships.remove は void を返す", async () => {
    setupSessionMember(CircleSessionRole.CircleSessionOwner);
    setupSessionFound();
    setupSessionMemberships([
      DEFAULT_SESSION_MEMBERSHIPS[0],
      {
        circleSessionId: SESSION_ID,
        userId: toUserId("user-3"),
        role: CircleSessionRole.CircleSessionMember,
        createdAt: NOW,
        deletedAt: null,
      },
    ]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circleSessions.memberships.remove({
      circleSessionId: "session-1",
      userId: "user-3",
    });

    expect(result).toBeUndefined();
  });

  // ========================================
  // Step 5: users 系テスト
  // ========================================

  test("users.get はユーザーを返す", async () => {
    setupRegisteredUser();
    mockDeps.userRepository.findById.mockResolvedValue({
      id: toUserId("user-2"),
      name: "テストユーザー",
      email: "test@example.com",
      image: null,
      hasCustomImage: false,
      profileVisibility: "PUBLIC" as const,
      createdAt: NOW,
    });

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.users.get({ userId: "user-2" });

    expect(result.id).toBe("user-2");
    expect(result.name).toBe("テストユーザー");
  });

  test("users.get は見つからないと NOT_FOUND", async () => {
    setupRegisteredUser();

    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.users.get({ userId: "user-not-found" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("users.list はユーザー一覧を返す", async () => {
    setupRegisteredUser();
    mockDeps.userRepository.findByIds.mockResolvedValue([
      {
        id: toUserId("user-1"),
        name: "ユーザー1",
        email: "user1@example.com",
        image: null,
        hasCustomImage: false,
        profileVisibility: "PUBLIC" as const,
        createdAt: NOW,
      },
      {
        id: toUserId("user-2"),
        name: "ユーザー2",
        email: "user2@example.com",
        image: null,
        hasCustomImage: false,
        profileVisibility: "PUBLIC" as const,
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.users.list({
      userIds: ["user-1", "user-2"],
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("user-1");
    expect(result[1].id).toBe("user-2");
  });

  // ========================================
  // 未実装プロシージャのテスト
  // ========================================

  test("users.memberships.list は Not implemented を返す", async () => {
    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.users.memberships.list({ userId: "user-1" }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});
