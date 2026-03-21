import { beforeEach, describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("@/server/env", () => ({ env: {} }));

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
} from "./__tests__/helpers/create-mock-deps";

const CIRCLE_ID = toCircleId("circle-1");
const SESSION_ID = toCircleSessionId("session-1");
const VIEWER_ID = toUserId("viewer-1");
const NOW = new Date("2025-01-01T00:00:00Z");

let mockDeps: MockDeps;
let actorId: ReturnType<typeof toUserId> | null = VIEWER_ID;

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () => Promise.resolve(createMockContext(actorId, mockDeps)),
}));

const { getCircleSessionDetailViewModel } = await import(
  "./circle-session-detail-provider"
);

const BASE_SESSION = {
  id: SESSION_ID,
  circleId: CIRCLE_ID,
  title: "テストセッション",
  startsAt: new Date("2025-01-01T10:00:00Z"),
  endsAt: new Date("2025-01-01T12:00:00Z"),
  location: "会議室",
  note: "",
  createdAt: NOW,
};

const makeSessionMembership = (uid: string, role: CircleSessionRole) => ({
  circleSessionId: SESSION_ID,
  userId: toUserId(uid),
  role,
  createdAt: NOW,
  deletedAt: null,
});

const makeUser = (uid: string, name: string) => ({
  id: toUserId(uid),
  name,
  email: null,
  image: null,
  hasCustomImage: false,
  profileVisibility: "PUBLIC" as const,
  createdAt: NOW,
});

describe("getCircleSessionDetailViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actorId = VIEWER_ID;
    mockDeps = createMockDeps();

    // Session exists
    mockDeps.circleSessionRepository.findById.mockResolvedValue(BASE_SESSION);

    // No matches by default
    mockDeps.matchRepository.listByCircleSessionId.mockResolvedValue([]);

    // Viewer is a circle member (needed for canViewCircle, canViewCircleSession, canViewMatch)
    mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
      kind: "member",
      role: CircleRole.CircleMember,
    });

    // Viewer is a registered user (needed for users.list -> canViewUser)
    mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
  });

  test("メンバー一覧がロール順（owner → manager → member）でソートされる", async () => {
    mockDeps.circleSessionRepository.listMemberships.mockResolvedValue([
      makeSessionMembership("u-member", CircleSessionRole.CircleSessionMember),
      makeSessionMembership("u-owner", CircleSessionRole.CircleSessionOwner),
      makeSessionMembership(
        "u-manager",
        CircleSessionRole.CircleSessionManager,
      ),
    ]);

    mockDeps.userRepository.findByIds.mockResolvedValue([
      makeUser("u-member", "メンバー"),
      makeUser("u-owner", "オーナー"),
      makeUser("u-manager", "マネージャー"),
    ]);

    const result = await getCircleSessionDetailViewModel("session-1");

    expect(result.memberships.map((m) => m.role)).toEqual([
      "owner",
      "manager",
      "member",
    ]);
  });

  test("対局記録のみの参加者（role=null）は最後尾に配置される", async () => {
    mockDeps.circleSessionRepository.listMemberships.mockResolvedValue([
      makeSessionMembership("u-member", CircleSessionRole.CircleSessionMember),
      makeSessionMembership("u-owner", CircleSessionRole.CircleSessionOwner),
    ]);

    mockDeps.matchRepository.listByCircleSessionId.mockResolvedValue([
      {
        id: toMatchId("match-1"),
        circleSessionId: SESSION_ID,
        player1Id: toUserId("u-member"),
        player2Id: toUserId("u-guest"),
        outcome: "P1_WIN" as const,
        createdAt: new Date("2025-01-01T10:30:00Z"),
        deletedAt: null,
      },
    ]);

    mockDeps.userRepository.findByIds.mockResolvedValue([
      makeUser("u-member", "メンバー"),
      makeUser("u-owner", "オーナー"),
      makeUser("u-guest", "ゲスト"),
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
    mockDeps.circleSessionRepository.listMemberships.mockResolvedValue([
      makeSessionMembership(
        "u-member-b",
        CircleSessionRole.CircleSessionMember,
      ),
      makeSessionMembership("u-owner", CircleSessionRole.CircleSessionOwner),
      makeSessionMembership(
        "u-member-a",
        CircleSessionRole.CircleSessionMember,
      ),
    ]);

    mockDeps.userRepository.findByIds.mockResolvedValue([
      makeUser("u-member-b", "メンバーB"),
      makeUser("u-owner", "オーナー"),
      makeUser("u-member-a", "メンバーA"),
    ]);

    const result = await getCircleSessionDetailViewModel("session-1");

    expect(result.memberships.map((m) => m.id)).toEqual([
      "u-owner",
      "u-member-b",
      "u-member-a",
    ]);
  });

  describe("認可エラー", () => {
    test("研究会メンバーでもセッションメンバーでもないユーザーがセッション詳細を取得するとFORBIDDENエラーになる", async () => {
      // authzRepository.findCircleMembership はデフォルト { kind: "none" } のまま
      // authzRepository.findCircleSessionMembership はデフォルト { kind: "none" } のまま
      // circleSessionRepository.findById は正常値を返す（セッション自体は存在する）

      // beforeEachで設定したfindCircleMembershipのmockを上書きしてデフォルトに戻す
      mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
        kind: "none",
      });

      await expect(
        getCircleSessionDetailViewModel("session-1"),
      ).rejects.toThrow(TRPCError);

      await expect(
        getCircleSessionDetailViewModel("session-1"),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証ユーザーがセッション詳細を取得するとUNAUTHORIZEDエラーになる", async () => {
      actorId = null;

      await expect(
        getCircleSessionDetailViewModel("session-1"),
      ).rejects.toThrow(TRPCError);

      await expect(
        getCircleSessionDetailViewModel("session-1"),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
