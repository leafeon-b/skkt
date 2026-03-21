import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import {
  toCircleId,
  toCircleInviteLinkId,
  toInviteLinkToken,
  toUserId,
} from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/presentation/providers/__tests__/helpers/create-mock-deps";

const ACTOR_ID = toUserId("user-1");
const CIRCLE_ID = toCircleId("circle-1");
const TEST_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440000";

const BASE_CIRCLE = {
  id: CIRCLE_ID,
  name: "テスト研究会",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  sessionEmailNotificationEnabled: true,
};

let mockDeps: MockDeps;

const buildContext = (actorId: ReturnType<typeof toUserId> | null = ACTOR_ID) =>
  createMockContext(actorId, mockDeps);

describe("circleInviteLink tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  test("circles.inviteLinks.create は招待リンクを返す", async () => {
    // createInviteLink needs:
    // 1. circleRepository.findById → circle exists
    // 2. accessService.canViewCircle → authzRepository.findCircleMembership → member
    // 3. circleInviteLinkRepository.findActiveByCircleId → null (no existing link)
    // 4. circleInviteLinkRepository.save
    mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);
    mockDeps.authzRepository.findCircleMembership.mockResolvedValue({
      kind: "member",
      role: CircleRole.CircleMember,
    });

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.inviteLinks.create({
      circleId: "circle-1",
    });

    expect(result.circleId).toBe("circle-1");
    expect(result.token).toBeDefined();
  });

  test("circles.inviteLinks.getInfo はリンク情報を返す", async () => {
    // getInviteLinkInfo needs:
    // 1. circleInviteLinkRepository.findByToken → link
    // 2. circleRepository.findById → circle (for name)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockDeps.circleInviteLinkRepository.findByToken.mockResolvedValue({
      id: toCircleInviteLinkId("link-1"),
      circleId: CIRCLE_ID,
      token: toInviteLinkToken(TEST_TOKEN_UUID),
      createdByUserId: ACTOR_ID,
      expiresAt: futureDate,
      createdAt: new Date("2026-02-16T00:00:00Z"),
    });
    mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.inviteLinks.getInfo({
      token: TEST_TOKEN_UUID,
    });

    expect(result.circleName).toBe("テスト研究会");
    expect(result.expired).toBe(false);
  });

  test("circles.inviteLinks.redeem は参加結果を返す", async () => {
    // redeemInviteLink needs:
    // 1. circleInviteLinkRepository.findByToken → link (not expired)
    // 2. circleRepository.findById → circle
    // 3. circleRepository.listMembershipsByCircleId → no matching membership
    // 4. circleRepository.addMembership
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockDeps.circleInviteLinkRepository.findByToken.mockResolvedValue({
      id: toCircleInviteLinkId("link-1"),
      circleId: CIRCLE_ID,
      token: toInviteLinkToken(TEST_TOKEN_UUID),
      createdByUserId: toUserId("other-user"),
      expiresAt: futureDate,
      createdAt: new Date("2026-02-16T00:00:00Z"),
    });
    mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);
    mockDeps.circleRepository.listMembershipsByCircleId.mockResolvedValue([]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.inviteLinks.redeem({
      token: TEST_TOKEN_UUID,
    });

    expect(result.circleId).toBe("circle-1");
    expect(result.alreadyMember).toBe(false);
  });

  test("circles.inviteLinks.redeem は既存メンバーの場合 alreadyMember=true", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    mockDeps.circleInviteLinkRepository.findByToken.mockResolvedValue({
      id: toCircleInviteLinkId("link-1"),
      circleId: CIRCLE_ID,
      token: toInviteLinkToken(TEST_TOKEN_UUID),
      createdByUserId: toUserId("other-user"),
      expiresAt: futureDate,
      createdAt: new Date("2026-02-16T00:00:00Z"),
    });
    mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);
    mockDeps.circleRepository.listMembershipsByCircleId.mockResolvedValue([
      {
        circleId: CIRCLE_ID,
        userId: ACTOR_ID,
        role: CircleRole.CircleMember,
        createdAt: new Date(),
        deletedAt: null,
      },
    ]);

    const caller = appRouter.createCaller(buildContext());
    const result = await caller.circles.inviteLinks.redeem({
      token: TEST_TOKEN_UUID,
    });

    expect(result.alreadyMember).toBe(true);
  });

  test("circles.inviteLinks.create はエラー時に適切なTRPCエラーを返す", async () => {
    // canViewCircle fails → ForbiddenError
    mockDeps.circleRepository.findById.mockResolvedValue(BASE_CIRCLE);
    // authzRepository.findCircleMembership defaults to { kind: "none" }

    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.circles.inviteLinks.create({ circleId: "circle-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("不正な形式のトークンはバリデーションエラーになる", async () => {
    const caller = appRouter.createCaller(buildContext());

    await expect(
      caller.circles.inviteLinks.getInfo({ token: "not-a-uuid" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
