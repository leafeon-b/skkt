import { describe, test, expect, vi, beforeEach } from "vitest";

const mockDisableByToken = vi.fn();

vi.mock("@/server/presentation/trpc/context", () => ({
  buildServiceContainer: () => ({
    notificationPreferenceService: {
      disableByToken: mockDisableByToken,
    },
  }),
}));

const { GET } = await import("@/app/api/unsubscribe/route");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/unsubscribe", () => {
  test("有効なトークンで配信停止成功", async () => {
    mockDisableByToken.mockResolvedValue({
      userId: "user-1",
      emailEnabled: false,
    });

    const request = new Request("http://localhost/api/unsubscribe?token=valid-token");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("メール配信を停止しました。");
    expect(mockDisableByToken).toHaveBeenCalledWith("valid-token");
  });

  test("無効なトークンで 400 エラー", async () => {
    mockDisableByToken.mockResolvedValue(null);

    const request = new Request("http://localhost/api/unsubscribe?token=invalid-token");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
  });

  test("token パラメータ未指定で 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("トークンが指定されていません。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });
});
