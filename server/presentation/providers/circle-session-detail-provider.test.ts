import { beforeEach, describe, expect, test, vi } from "vitest";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";

const mockSessionGet = vi.fn();
const mockCirclesGet = vi.fn();
const mockSessionMembershipsList = vi.fn();
const mockMatchesList = vi.fn();
const mockUsersList = vi.fn();
const mockCircleMembershipsList = vi.fn();

const stubAccessService = {
  canCreateCircleSession: vi.fn().mockResolvedValue(false),
  canEditCircleSession: vi.fn().mockResolvedValue(false),
  canDeleteCircleSession: vi.fn().mockResolvedValue(false),
  canWithdrawFromCircleSession: vi.fn().mockResolvedValue(false),
  canAddCircleSessionMember: vi.fn().mockResolvedValue(false),
  canRemoveCircleSessionMember: vi.fn().mockResolvedValue(false),
  canTransferCircleSessionOwnership: vi.fn().mockResolvedValue(false),
  canChangeCircleSessionMemberRole: vi.fn().mockResolvedValue(false),
};

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () =>
    Promise.resolve({
      actorId: "viewer-1",
      accessService: stubAccessService,
      circleSessionMembershipService: {
        listDeletedMemberships: vi.fn().mockResolvedValue([]),
      },
    }),
}));

vi.mock("@/server/presentation/trpc/router", () => ({
  appRouter: {
    createCaller: () => ({
      circles: {
        get: mockCirclesGet,
        memberships: { list: mockCircleMembershipsList },
      },
      circleSessions: {
        get: mockSessionGet,
        memberships: { list: mockSessionMembershipsList },
      },
      matches: { list: mockMatchesList },
      users: { list: mockUsersList },
    }),
  },
}));

const { getCircleSessionDetailViewModel } = await import(
  "./circle-session-detail-provider"
);

const BASE_SESSION = {
  id: "session-1",
  circleId: "circle-1",
  title: "テストセッション",
  startsAt: new Date("2025-01-01T10:00:00Z"),
  endsAt: new Date("2025-01-01T12:00:00Z"),
  location: "会議室",
  note: "",
};

describe("getCircleSessionDetailViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionGet.mockResolvedValue(BASE_SESSION);
    mockCirclesGet.mockResolvedValue({ id: "circle-1", name: "テスト研究会" });
    mockMatchesList.mockResolvedValue([]);
  });

  test("メンバー一覧がロール順（owner → manager → member）でソートされる", async () => {
    mockSessionMembershipsList.mockResolvedValue([
      { userId: "u-member", role: CircleSessionRole.CircleSessionMember },
      { userId: "u-owner", role: CircleSessionRole.CircleSessionOwner },
      { userId: "u-manager", role: CircleSessionRole.CircleSessionManager },
    ]);
    mockUsersList.mockResolvedValue([
      { id: "u-member", name: "メンバー" },
      { id: "u-owner", name: "オーナー" },
      { id: "u-manager", name: "マネージャー" },
    ]);

    const result = await getCircleSessionDetailViewModel("session-1");

    expect(result.memberships.map((m) => m.role)).toEqual([
      "owner",
      "manager",
      "member",
    ]);
  });

  test("対局記録のみの参加者（role=null）は最後尾に配置される", async () => {
    mockSessionMembershipsList.mockResolvedValue([
      { userId: "u-member", role: CircleSessionRole.CircleSessionMember },
      { userId: "u-owner", role: CircleSessionRole.CircleSessionOwner },
    ]);
    mockMatchesList.mockResolvedValue([
      {
        id: "match-1",
        player1Id: "u-member",
        player2Id: "u-guest",
        outcome: "P1_WIN",
        createdAt: new Date("2025-01-01T10:30:00Z"),
        deletedAt: null,
      },
    ]);
    mockUsersList.mockResolvedValue([
      { id: "u-member", name: "メンバー" },
      { id: "u-owner", name: "オーナー" },
      { id: "u-guest", name: "ゲスト" },
    ]);

    const result = await getCircleSessionDetailViewModel("session-1");

    expect(result.memberships.map((m) => m.role)).toEqual([
      "owner",
      "member",
      null,
    ]);
    expect(result.memberships[2].id).toBe("u-guest");
  });

  test("同一ロール内では元の配列順序が維持される", async () => {
    mockSessionMembershipsList.mockResolvedValue([
      { userId: "u-member-b", role: CircleSessionRole.CircleSessionMember },
      { userId: "u-owner", role: CircleSessionRole.CircleSessionOwner },
      { userId: "u-member-a", role: CircleSessionRole.CircleSessionMember },
    ]);
    mockUsersList.mockResolvedValue([
      { id: "u-member-b", name: "メンバーB" },
      { id: "u-owner", name: "オーナー" },
      { id: "u-member-a", name: "メンバーA" },
    ]);

    const result = await getCircleSessionDetailViewModel("session-1");

    expect(result.memberships.map((m) => m.id)).toEqual([
      "u-owner",
      "u-member-b",
      "u-member-a",
    ]);
  });
});
