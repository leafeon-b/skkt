import { beforeEach, describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("@/server/env", () => ({ env: {} }));

import {
  toCircleId,
  toCircleInviteLinkId,
  toInviteLinkToken,
  toUserId,
} from "@/server/domain/common/ids";
import { createServiceContainer } from "@/server/infrastructure/service-container";
import {
  createMockDeps,
  toServiceContainerDeps,
  type MockDeps,
} from "./__tests__/helpers/create-mock-deps";

const VALID_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440000";
const UNKNOWN_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440099";

let mockDeps: MockDeps;
let actorId: ReturnType<typeof toUserId> | null = null;

vi.mock("@/server/presentation/trpc/context", () => ({
  createContext: () => {
    const services = createServiceContainer(toServiceContainerDeps(mockDeps));
    return Promise.resolve({ actorId, ...services });
  },
}));

// dynamic import after mocks are registered
const { getInviteLinkPageData } = await import("./invite-link-provider");

const CIRCLE_ID = toCircleId("circle-1");
const LINK_TOKEN = toInviteLinkToken(VALID_TOKEN_UUID);

const VALID_INVITE_LINK = {
  id: toCircleInviteLinkId("link-1"),
  circleId: CIRCLE_ID,
  token: LINK_TOKEN,
  createdByUserId: toUserId("creator-1"),
  expiresAt: new Date("2099-12-31T00:00:00Z"),
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

const VALID_CIRCLE = {
  id: CIRCLE_ID,
  name: "テスト研究会",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  sessionEmailNotificationEnabled: true,
};

describe("getInviteLinkPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
    actorId = null;
  });

  test("有効なトークンで InviteLinkPageData を返す", async () => {
    mockDeps.circleInviteLinkRepository.findByToken.mockResolvedValueOnce(
      VALID_INVITE_LINK,
    );
    mockDeps.circleRepository.findById.mockResolvedValueOnce(VALID_CIRCLE);
    actorId = toUserId("user-1");

    const result = await getInviteLinkPageData(VALID_TOKEN_UUID);

    expect(result).toEqual({
      circleName: "テスト研究会",
      circleId: "circle-1",
      expired: false,
      isAuthenticated: true,
    });
  });

  test("未認証ユーザーの場合 isAuthenticated が false を返す", async () => {
    mockDeps.circleInviteLinkRepository.findByToken.mockResolvedValueOnce(
      VALID_INVITE_LINK,
    );
    mockDeps.circleRepository.findById.mockResolvedValueOnce(VALID_CIRCLE);

    const result = await getInviteLinkPageData(VALID_TOKEN_UUID);

    expect(result).toEqual({
      circleName: "テスト研究会",
      circleId: "circle-1",
      expired: false,
      isAuthenticated: false,
    });
  });

  test("NotFoundError の場合 null を返す", async () => {
    // findByToken returns null -> service throws NotFoundError -> tRPC converts to NOT_FOUND
    mockDeps.circleInviteLinkRepository.findByToken.mockResolvedValueOnce(null);

    const result = await getInviteLinkPageData(UNKNOWN_TOKEN_UUID);

    expect(result).toBeNull();
  });

  test("不正な形式のトークンは null を返す", async () => {
    const result = await getInviteLinkPageData("not-a-uuid");

    expect(result).toBeNull();
    expect(
      mockDeps.circleInviteLinkRepository.findByToken,
    ).not.toHaveBeenCalled();
  });

  test("予期しないエラーは re-throw される", async () => {
    mockDeps.circleInviteLinkRepository.findByToken.mockRejectedValueOnce(
      new Error("DB connection failed"),
    );

    await expect(getInviteLinkPageData(VALID_TOKEN_UUID)).rejects.toThrow(
      TRPCError,
    );
  });
});
