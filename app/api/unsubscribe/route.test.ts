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

const { GET, POST } = await import("@/app/api/unsubscribe/route");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/unsubscribe", () => {
  test("トークン付きGETリクエストは /unsubscribe にリダイレクトする", async () => {
    const token = "dmFsaWQtdG9rZW4tZm9yLXRlc3Q";
    const request = new Request(
      `http://localhost/api/unsubscribe?token=${token}`,
    );
    const response = await GET(request);

    expect(response.status).toBe(302);
    const location = response.headers.get("location");
    expect(location).toContain("/unsubscribe");
    expect(location).toContain(`token=${token}`);
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("トークンなしGETリクエストは /unsubscribe にリダイレクトする", async () => {
    const request = new Request("http://localhost/api/unsubscribe");
    const response = await GET(request);

    expect(response.status).toBe(302);
    const location = response.headers.get("location");
    expect(location).toContain("/unsubscribe");
    expect(location).not.toContain("token=");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });
});

describe("POST /api/unsubscribe", () => {
  test("有効なトークンで配信停止成功", async () => {
    mockDisableByToken.mockResolvedValue({
      userId: "user-1",
      emailEnabled: false,
    });

    const token = "dmFsaWQtdG9rZW4tZm9yLXRlc3Q";
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("メール配信を停止しました。");
    expect(mockDisableByToken).toHaveBeenCalledWith(token);
  });

  test("無効なトークンで 400 エラー", async () => {
    mockDisableByToken.mockResolvedValue(null);

    const token = "aW52YWxpZC10b2tlbi1mb3ItdGVzdA";
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
  });

  test("空白のみのトークンで 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "   " }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("トークンが指定されていません。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("不正な文字を含むトークンで 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid!@#$%token12345" }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("短すぎるトークンで 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "abc123" }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("長すぎるトークンで 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "a".repeat(257) }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("無効なトークンです。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("token フィールド未指定で 400 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("トークンが指定されていません。");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("application/x-www-form-urlencoded でトークンを送信できる", async () => {
    mockDisableByToken.mockResolvedValue({
      userId: "user-1",
      emailEnabled: false,
    });

    const token = "dmFsaWQtdG9rZW4tZm9yLXRlc3Q";
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `token=${token}`,
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("メール配信を停止しました。");
    expect(mockDisableByToken).toHaveBeenCalledWith(token);
  });

  test("URLクエリパラメータからトークンを読み取れる（RFC 8058 One-Click対応）", async () => {
    mockDisableByToken.mockResolvedValue({
      userId: "user-1",
      emailEnabled: false,
    });

    const token = "dmFsaWQtdG9rZW4tZm9yLXRlc3Q";
    const request = new Request(
      `http://localhost/api/unsubscribe?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      },
    );
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("メール配信を停止しました。");
    expect(mockDisableByToken).toHaveBeenCalledWith(token);
  });

  test("ボディとクエリパラメータの両方にトークンがある場合、ボディのトークンが優先される", async () => {
    const bodyToken = "Ym9keS10b2tlbi1mb3ItdGVzdA";
    const queryToken = "cXVlcnktdG9rZW4tZm9yLXRlc3Q";
    mockDisableByToken.mockResolvedValue({
      userId: "user-1",
      emailEnabled: false,
    });

    const request = new Request(
      `http://localhost/api/unsubscribe?token=${queryToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: bodyToken }),
      },
    );
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("メール配信を停止しました。");
    expect(mockDisableByToken).toHaveBeenCalledWith(bodyToken);
  });

  test("サポート外のContent-Typeで 415 エラー", async () => {
    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "token=test",
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(415);
    expect(body.message).toBe("Unsupported Content-Type");
    expect(mockDisableByToken).not.toHaveBeenCalled();
  });

  test("DomainError がスローされた場合、対応するHTTPステータスとメッセージを返す", async () => {
    mockDisableByToken.mockRejectedValue(
      new BadRequestError("トークンの形式が不正です。"),
    );

    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "bWFsZm9ybWVkLXRva2VuLXRlc3Q" }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("トークンの形式が不正です。");
  });

  test("未知のエラーがスローされた場合、500レスポンスと汎用メッセージを返す", async () => {
    mockDisableByToken.mockRejectedValue(new Error("unexpected DB error"));

    const request = new Request("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "c29tZS10b2tlbi1mb3ItdGVzdA" }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Internal server error");
  });
});
