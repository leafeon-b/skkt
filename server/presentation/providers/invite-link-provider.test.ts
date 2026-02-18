import { beforeEach, describe, expect, test, vi } from "vitest";
import { NotFoundError } from "@/server/domain/common/errors";

const mockGetInviteLinkInfo = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/server/application/circle/circle-invite-link-service", () => ({
  createCircleInviteLinkService: () => ({
    getInviteLinkInfo: mockGetInviteLinkInfo,
  }),
}));

vi.mock("@/server/application/authz/access-service", () => ({
  createAccessService: () => ({}),
}));

vi.mock("@/server/infrastructure/auth/nextauth-session-service", () => ({
  nextAuthSessionService: { getSession: mockGetSession },
}));

vi.mock(
  "@/server/infrastructure/repository/circle/prisma-circle-invite-link-repository",
  () => ({ prismaCircleInviteLinkRepository: {} }),
);
vi.mock(
  "@/server/infrastructure/repository/circle/prisma-circle-repository",
  () => ({ prismaCircleRepository: {} }),
);
vi.mock(
  "@/server/infrastructure/repository/circle/prisma-circle-participation-repository",
  () => ({ prismaCircleParticipationRepository: {} }),
);
vi.mock(
  "@/server/infrastructure/repository/authz/prisma-authz-repository",
  () => ({ prismaAuthzRepository: {} }),
);

// dynamic import after mocks are registered
const { getInviteLinkPageData } = await import("./invite-link-provider");

describe("getInviteLinkPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("有効なトークンで InviteLinkPageData を返す", async () => {
    mockGetInviteLinkInfo.mockResolvedValueOnce({
      token: "valid-token",
      circleName: "テスト研究会",
      circleId: "circle-1",
      expired: false,
    });
    mockGetSession.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await getInviteLinkPageData("valid-token");

    expect(result).toEqual({
      circleName: "テスト研究会",
      circleId: "circle-1",
      expired: false,
      isAuthenticated: true,
    });
  });

  test("NotFoundError の場合 null を返す", async () => {
    mockGetInviteLinkInfo.mockRejectedValueOnce(
      new NotFoundError("InviteLink"),
    );

    const result = await getInviteLinkPageData("unknown-token");

    expect(result).toBeNull();
  });

  test("予期しないエラーは re-throw される", async () => {
    const unexpected = new Error("DB connection failed");
    mockGetInviteLinkInfo.mockRejectedValueOnce(unexpected);

    await expect(getInviteLinkPageData("any-token")).rejects.toThrow(
      unexpected,
    );
  });
});
