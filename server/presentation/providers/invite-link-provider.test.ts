import { beforeEach, describe, expect, test, vi } from "vitest";
import { NotFoundError } from "@/server/domain/common/errors";
import { inviteLinkToken } from "@/server/domain/common/ids";

const mockGetInviteLinkInfo = vi.fn();
const mockActorId = vi.fn<() => string | null>();

const VALID_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440000";
const UNKNOWN_TOKEN_UUID = "550e8400-e29b-41d4-a716-446655440099";

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
      token: inviteLinkToken(VALID_TOKEN_UUID),
      circleName: "テスト研究会",
      circleId: "circle-1",
      expired: false,
    });
    mockActorId.mockReturnValueOnce("user-1");

    const result = await getInviteLinkPageData(VALID_TOKEN_UUID);

    expect(mockGetInviteLinkInfo).toHaveBeenCalledWith({
      token: inviteLinkToken(VALID_TOKEN_UUID),
    });
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

    const result = await getInviteLinkPageData(UNKNOWN_TOKEN_UUID);

    expect(result).toBeNull();
  });

  test("不正な形式のトークンは null を返す", async () => {
    mockActorId.mockReturnValueOnce(null);

    const result = await getInviteLinkPageData("not-a-uuid");

    expect(result).toBeNull();
    expect(mockGetInviteLinkInfo).not.toHaveBeenCalled();
  });

  test("予期しないエラーは re-throw される", async () => {
    const unexpected = new Error("DB connection failed");
    mockGetInviteLinkInfo.mockRejectedValueOnce(unexpected);
    mockActorId.mockReturnValueOnce(null);

    await expect(
      getInviteLinkPageData(VALID_TOKEN_UUID),
    ).rejects.toThrow(unexpected);
  });
});
