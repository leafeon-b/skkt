import { beforeEach, describe, expect, test, vi } from "vitest";
import { TooManyRequestsError } from "@/server/domain/common/errors";

const { mockEmailIpCheck, mockIpCheck } = vi.hoisted(() => ({
  mockEmailIpCheck: vi.fn(),
  mockIpCheck: vi.fn(),
}));

vi.mock("@/server/infrastructure/rate-limit/prisma-rate-limiter", () => ({
  createPrismaRateLimiter: (config: { category: string }) => {
    if (config.category === "login-ip") return { check: mockIpCheck };
    return { check: mockEmailIpCheck };
  },
}));

vi.mock("@/server/infrastructure/auth/auth-config", () => ({
  LOGIN_RATE_LIMIT_CONFIG: {
    maxAttempts: 5,
    windowMs: 60_000,
    category: "login",
  },
  LOGIN_IP_RATE_LIMIT_CONFIG: {
    maxAttempts: 20,
    windowMs: 60_000,
    category: "login-ip",
  },
}));

import { POST } from "./route";

function createRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login-rate-limit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.2.3.4",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login-rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("email:ipレート制限中の場合、retryAfterMsを返す", async () => {
    mockEmailIpCheck.mockRejectedValueOnce(new TooManyRequestsError(45_000));

    const res = await POST(createRequest({ email: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ retryAfterMs: 45_000 });
    expect(mockEmailIpCheck).toHaveBeenCalledWith("test@example.com:1.2.3.4");
  });

  test("IPのみのレート制限中の場合、retryAfterMsを返す", async () => {
    mockIpCheck.mockRejectedValueOnce(new TooManyRequestsError(30_000));

    const res = await POST(createRequest({ email: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ retryAfterMs: 30_000 });
    expect(mockIpCheck).toHaveBeenCalledWith("1.2.3.4");
  });

  test("両方のレート制限中の場合、大きい方のretryAfterMsを返す", async () => {
    mockIpCheck.mockRejectedValueOnce(new TooManyRequestsError(20_000));
    mockEmailIpCheck.mockRejectedValueOnce(new TooManyRequestsError(45_000));

    const res = await POST(createRequest({ email: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ retryAfterMs: 45_000 });
  });

  test("レート制限中でない場合、空オブジェクトを返す", async () => {
    mockEmailIpCheck.mockResolvedValueOnce(undefined);
    mockIpCheck.mockResolvedValueOnce(undefined);

    const res = await POST(createRequest({ email: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({});
  });

  test("emailが空の場合、400を返す", async () => {
    const res = await POST(createRequest({ email: "" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "email is required" });
    expect(mockEmailIpCheck).not.toHaveBeenCalled();
    expect(mockIpCheck).not.toHaveBeenCalled();
  });

  test("emailが未指定の場合、400を返す", async () => {
    const res = await POST(createRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "email is required" });
    expect(mockEmailIpCheck).not.toHaveBeenCalled();
    expect(mockIpCheck).not.toHaveBeenCalled();
  });

  test("予期しないエラーの場合、500を返す", async () => {
    mockIpCheck.mockRejectedValueOnce(new Error("unexpected"));

    const res = await POST(createRequest({ email: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "internal server error" });
  });

  test("不正なJSONの場合、400を返す", async () => {
    const req = new Request("http://localhost/api/auth/login-rate-limit", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "not json",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "invalid request body" });
    expect(mockEmailIpCheck).not.toHaveBeenCalled();
    expect(mockIpCheck).not.toHaveBeenCalled();
  });

  test("emailが文字列以外の場合、400を返す", async () => {
    const res = await POST(createRequest({ email: 123 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "email is required" });
    expect(mockEmailIpCheck).not.toHaveBeenCalled();
    expect(mockIpCheck).not.toHaveBeenCalled();
  });
});
