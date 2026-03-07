import { describe, test, expect, vi, beforeEach } from "vitest";
import { BadRequestError } from "@/server/domain/common/errors";

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

    const token = "dmFsaWQtdG9rZW4tZm9yLXRlc3Q";
    const request = new Request(`http://localhost/api/unsubscribe?token=${token}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("メール配信を停止しました。");
    expect(mockDisableByToken).toHaveBeenCalledWith(token);
  });

  test("無効なトークンで 400 エラー", async () => {
    mockDisableByToken.mockResolvedValue(null);

    const token = "aW52YWxpZC10b2tlbi1mb3ItdGVzdA";
    const request = new Request(`http://localhost/api/unsubscribe?token=${token}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
  });

  test("空白のみのトークンで 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe?token=%20%20");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("トークンが指定されていません。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("不正な文字を含むトークンで 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe?token=invalid!%40%23%24%25token12345");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("短すぎるトークンで 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe?token=abc123");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("長すぎるトークンで 400 エラー", async () => {
    const longToken = "a".repeat(257);
    const request = new Request(`http://localhost/api/unsubscribe?token=${longToken}`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("token パラメータ未指定で 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("トークンが指定されていません。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("DomainError がスローされた場合、対応するHTTPステータスとメッセージを返す", async () => {
    mockDisableByToken.mockRejectedValue(
      new BadRequestError("トークンの形式が不正です。"),
    );

    const request = new Request(
      "http://localhost/api/unsubscribe?token=bWFsZm9ybWVkLXRva2VuLXRlc3Q",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("トークンの形式が不正です。");
  });

  test("未知のエラーがスローされた場合、500レスポンスと汎用メッセージを返す", async () => {
    mockDisableByToken.mockRejectedValue(new Error("unexpected DB error"));

    const request = new Request(
      "http://localhost/api/unsubscribe?token=c29tZS10b2tlbi1mb3ItdGVzdA",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Internal server error");
  });
});
