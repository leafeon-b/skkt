import { beforeEach, describe, expect, test, vi } from "vitest";
import { NotFoundError } from "@/server/domain/common/errors";

const mockGetInviteLinkInfo = vi.fn();
const mockActorId = vi.fn<() => string | null>();

vi.mock("@/server/presentation/trpc/context", () => ({
  createPublicContext: () =>
    Promise.resolve({
      actorId: mockActorId(),
      circleInviteLinkService: {
        getInviteLinkInfo: mockGetInviteLinkInfo,
      },
    }),
}));

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
    mockActorId.mockReturnValueOnce("user-1");

    const result = await getInviteLinkPageData("valid-token");

    expect(mockGetInviteLinkInfo).toHaveBeenCalledWith({ token: "valid-token" });
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
    mockActorId.mockReturnValueOnce(null);

    const result = await getInviteLinkPageData("unknown-token");

    expect(result).toBeNull();
  });

  test("予期しないエラーは re-throw される", async () => {
    const unexpected = new Error("DB connection failed");
    mockGetInviteLinkInfo.mockRejectedValueOnce(unexpected);
    mockActorId.mockReturnValueOnce(null);

    await expect(getInviteLinkPageData("any-token")).rejects.toThrow(
      unexpected,
    );
  });
});
