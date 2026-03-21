import { beforeEach, describe, expect, test, vi } from "vitest";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";

vi.mock("@/server/env", () => ({ env: {} }));

import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "./__tests__/helpers/create-mock-deps";

const CIRCLE_ID = toCircleId("circle-1");
const VIEWER_ID = toUserId("viewer-1");
const NOW = new Date("2025-01-01T00:00:00Z");

let mockDeps: MockDeps;
let actorId: ReturnType<typeof toUserId> | null = VIEWER_ID;

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () => Promise.resolve(createMockContext(actorId, mockDeps)),
}));

const { getCircleSettingsViewModel } = await import(
  "./circle-settings-provider"
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

describe("getCircleSettingsViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actorId = VIEWER_ID;
    mockDeps = createMockDeps();

    mockDeps.circleRepository.findById.mockResolvedValue(VALID_CIRCLE);
    mockDeps.circleSessionRepository.listByCircleId.mockResolvedValue([]);
    mockDeps.authzRepository.isRegisteredUser.mockResolvedValue(true);
  });

  test("認可ゲート: 一般メンバーにはnullを返す", async () => {
    mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
      kind: "member" as const,
      role: CircleRole.CircleMember,
    });

    const result = await getCircleSettingsViewModel("circle-1");

    expect(result).toBeNull();
  });

  test("認可ゲート: マネージャーにもnullを返す", async () => {
    mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
      kind: "member" as const,
      role: CircleRole.CircleManager,
    });

    const result = await getCircleSettingsViewModel("circle-1");

    expect(result).toBeNull();
  });

  test("認可ゲート: 非メンバーにはnullを返す", async () => {
    // findCircleMembership のデフォルトは { kind: "none" }
    const result = await getCircleSettingsViewModel("circle-1");

    expect(result).toBeNull();
  });

  test("認可ゲート: 未認証ユーザーにはnullを返す", async () => {
    actorId = null;

    const result = await getCircleSettingsViewModel("circle-1");

    expect(result).toBeNull();
  });

  test("オーナーには設定ViewModelを返す", async () => {
    mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
      kind: "member" as const,
      role: CircleRole.CircleOwner,
    });

    const memberships = [
      makeCircleMembership("viewer-1", CircleRole.CircleOwner),
    ];
    mockDeps.circleRepository.listMembershipsByCircleId.mockResolvedValue(
      memberships,
    );

    mockDeps.userRepository.findByIds.mockResolvedValue([
      makeUser("viewer-1", "オーナー"),
    ]);

    const result = await getCircleSettingsViewModel("circle-1");

    expect(result).toEqual({
      circleId: CIRCLE_ID,
      circleName: "テスト研究会",
      sessionEmailNotificationEnabled: true,
      viewerUserId: VIEWER_ID,
      members: [
        {
          userId: VIEWER_ID,
          name: "オーナー",
          role: "owner",
          canChangeRole: false,
          canRemoveMember: false,
        },
      ],
    });
  });

  test("メンバー一覧がロール順（owner → manager → member）でソートされる", async () => {
    mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
      kind: "member" as const,
      role: CircleRole.CircleOwner,
    });

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

    const result = await getCircleSettingsViewModel("circle-1");

    expect(result!.members.map((m) => m.role)).toEqual([
      "owner",
      "manager",
      "member",
    ]);
  });
});
