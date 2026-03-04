import { beforeEach, describe, expect, test, vi } from "vitest";
import { CircleRole } from "@/server/domain/models/circle/circle-role";

const mockCirclesGet = vi.fn();
const mockMembershipsList = vi.fn();
const mockSessionsList = vi.fn();
const mockUsersList = vi.fn();
const mockCanDeleteCircle = vi.fn().mockResolvedValue(false);
const mockCanEditCircle = vi.fn().mockResolvedValue(false);
const mockCanRemoveCircleMember = vi.fn().mockResolvedValue(false);
const mockCanTransferCircleOwnership = vi.fn().mockResolvedValue(false);
const mockCanChangeCircleMemberRole = vi.fn().mockResolvedValue(false);

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () =>
    Promise.resolve({
      actorId: "viewer-1",
      accessService: {
        canDeleteCircle: mockCanDeleteCircle,
        canEditCircle: mockCanEditCircle,
        canRemoveCircleMember: mockCanRemoveCircleMember,
        canTransferCircleOwnership: mockCanTransferCircleOwnership,
        canChangeCircleMemberRole: mockCanChangeCircleMemberRole,
      },
      holidayProvider: {
        getHolidayDateStringsForRange: () => [],
      },
    }),
}));

vi.mock("@/server/presentation/trpc/router", () => ({
  appRouter: {
    createCaller: () => ({
      circles: {
        get: mockCirclesGet,
        memberships: { list: mockMembershipsList },
      },
      circleSessions: { list: mockSessionsList },
      users: { list: mockUsersList },
    }),
  },
}));

const { getCircleOverviewViewModel } = await import(
  "./circle-overview-provider"
);

describe("getCircleOverviewViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCirclesGet.mockResolvedValue({
      id: "circle-1",
      name: "テスト研究会",
    });
    mockSessionsList.mockResolvedValue([]);
  });

  test("メンバー一覧がロール順（owner → manager → member）でソートされる", async () => {
    mockMembershipsList.mockResolvedValue([
      { userId: "u-member", role: CircleRole.CircleMember },
      { userId: "u-owner", role: CircleRole.CircleOwner },
      { userId: "u-manager", role: CircleRole.CircleManager },
    ]);
    mockUsersList.mockResolvedValue([
      { id: "u-member", name: "メンバー" },
      { id: "u-owner", name: "オーナー" },
      { id: "u-manager", name: "マネージャー" },
    ]);

    const result = await getCircleOverviewViewModel("circle-1");

    expect(result.members.map((m) => m.role)).toEqual([
      "owner",
      "manager",
      "member",
    ]);
  });

  test("同一ロール内では元の配列順序が維持される", async () => {
    mockMembershipsList.mockResolvedValue([
      { userId: "u-member-b", role: CircleRole.CircleMember },
      { userId: "u-owner", role: CircleRole.CircleOwner },
      { userId: "u-member-a", role: CircleRole.CircleMember },
    ]);
    mockUsersList.mockResolvedValue([
      { id: "u-member-b", name: "メンバーB" },
      { id: "u-owner", name: "オーナー" },
      { id: "u-member-a", name: "メンバーA" },
    ]);

    const result = await getCircleOverviewViewModel("circle-1");

    expect(result.members.map((m) => m.userId)).toEqual([
      "u-owner",
      "u-member-b",
      "u-member-a",
    ]);
  });
});
