import { beforeEach, describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";

vi.mock("@/server/env", () => ({ env: {} }));

import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/test-utils/create-mock-deps";

const CIRCLE_ID = toCircleId("circle-1");
const VIEWER_ID = toUserId("viewer-1");
const NOW = new Date("2025-01-01T00:00:00Z");

let mockDeps: MockDeps;
let actorId: ReturnType<typeof toUserId> | null = VIEWER_ID;

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () => Promise.resolve(createMockContext(actorId, mockDeps)),
}));

const { getCircleOverviewViewModel } = await import(
  "./circle-overview-provider"
);

const VALID_CIRCLE = {
  id: CIRCLE_ID,
  name: "テスト研究会",
  createdAt: NOW,
  sessionEmailNotificationEnabled: true,
};

const makeCircleMembership = (uid: string, role: CircleRole) => ({
  circleId: CIRCLE_ID,
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

describe("getCircleOverviewViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actorId = VIEWER_ID;
    mockDeps = createMockDeps();

    // Circle exists
    mockDeps.circleRepository.findById.mockResolvedValue(VALID_CIRCLE);

    // No sessions by default
    mockDeps.circleSessionRepository.listByCircleId.mockResolvedValue([]);

    // Viewer is a circle member (needed for canViewCircle and other access checks)
    mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
  });

  test("メンバー一覧がロール順（owner → manager → member）でソートされる", async () => {
    const memberships = [
      makeCircleMembership("u-member", CircleRole.CircleMember),
      makeCircleMembership("u-owner", CircleRole.CircleOwner),
      makeCircleMembership("u-manager", CircleRole.CircleManager),
    ];
    mockDeps.circleRepository.listMembershipsByCircleId.mockResolvedValue(
      memberships,
    );

    mockDeps.userRepository.findByIds.mockResolvedValue([
      makeUser("u-member", "メンバー"),
      makeUser("u-owner", "オーナー"),
      makeUser("u-manager", "マネージャー"),
    ]);

    mockDeps.authzRepository.findCircleMembership.mockImplementation(
      async (uid: string) => {
        const roles: Record<string, CircleRole> = {
          "viewer-1": CircleRole.CircleMember,
          "u-owner": CircleRole.CircleOwner,
          "u-manager": CircleRole.CircleManager,
          "u-member": CircleRole.CircleMember,
        };
        const role = roles[uid];
        if (role) return { kind: "member" as const, role };
        return { kind: "none" as const };
      },
    );

    const result = await getCircleOverviewViewModel("circle-1");

    expect(result.members.map((m) => m.role)).toEqual([
      "owner",
      "manager",
      "member",
    ]);
  });

  test("同一ロール内では元の配列順序が維持される", async () => {
    const memberships = [
      makeCircleMembership("u-member-b", CircleRole.CircleMember),
      makeCircleMembership("u-owner", CircleRole.CircleOwner),
      makeCircleMembership("u-member-a", CircleRole.CircleMember),
    ];
    mockDeps.circleRepository.listMembershipsByCircleId.mockResolvedValue(
      memberships,
    );

    mockDeps.userRepository.findByIds.mockResolvedValue([
      makeUser("u-member-b", "メンバーB"),
      makeUser("u-owner", "オーナー"),
      makeUser("u-member-a", "メンバーA"),
    ]);

    mockDeps.authzRepository.findCircleMembership.mockImplementation(
      async (uid: string) => {
        const roles: Record<string, CircleRole> = {
          "viewer-1": CircleRole.CircleMember,
          "u-owner": CircleRole.CircleOwner,
          "u-member-b": CircleRole.CircleMember,
          "u-member-a": CircleRole.CircleMember,
        };
        const role = roles[uid];
        if (role) return { kind: "member" as const, role };
        return { kind: "none" as const };
      },
    );

    const result = await getCircleOverviewViewModel("circle-1");

    expect(result.members.map((m) => m.userId)).toEqual([
      "u-owner",
      "u-member-b",
      "u-member-a",
    ]);
  });

  describe("認可エラー", () => {
    test("研究会メンバーでないユーザーが研究会詳細を取得するとFORBIDDENエラーになる", async () => {
      // authzRepository.findCircleMembership はデフォルト { kind: "none" } のまま
      // circleRepository.findById は正常値を返す（研究会自体は存在する）

      await expect(
        getCircleOverviewViewModel("circle-1"),
      ).rejects.toThrow(TRPCError);

      await expect(
        getCircleOverviewViewModel("circle-1"),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    test("未認証ユーザーが研究会詳細を取得するとUNAUTHORIZEDエラーになる", async () => {
      actorId = null;

      await expect(
        getCircleOverviewViewModel("circle-1"),
      ).rejects.toThrow(TRPCError);

      await expect(
        getCircleOverviewViewModel("circle-1"),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
