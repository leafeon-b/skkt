import { beforeEach, describe, expect, test, vi } from "vitest";
import { TooManyRequestsError } from "@/server/domain/common/errors";

const { mockCheck } = vi.hoisted(() => ({ mockCheck: vi.fn() }));

vi.mock("@/server/infrastructure/rate-limit/prisma-rate-limiter", () => ({
  createPrismaRateLimiter: () => ({ check: mockCheck }),
}));

vi.mock("@/server/infrastructure/auth/auth-config", () => ({
  LOGIN_RATE_LIMIT_CONFIG: {
    maxAttempts: 5,
    windowMs: 60_000,
    category: "login",
  },
}));

import { POST } from "./route";

function createRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login-rate-limit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login-rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("レート制限中の場合、retryAfterMsを返す", async () => {
    mockCheck.mockRejectedValueOnce(new TooManyRequestsError(45_000));

    const res = await POST(createRequest({ email: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ retryAfterMs: 45_000 });
    expect(mockCheck).toHaveBeenCalledWith("test@example.com");
  });

  test("レート制限中でない場合、空オブジェクトを返す", async () => {
    mockCheck.mockResolvedValueOnce(undefined);

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
    expect(mockCheck).not.toHaveBeenCalled();
  });

  test("emailが未指定の場合、400を返す", async () => {
    const res = await POST(createRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "email is required" });
    expect(mockCheck).not.toHaveBeenCalled();
  });

  test("予期しないエラーの場合、500を返す", async () => {
    mockCheck.mockRejectedValueOnce(new Error("unexpected"));

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
    expect(mockCheck).not.toHaveBeenCalled();
  });

  test("emailが文字列以外の場合、400を返す", async () => {
    const res = await POST(createRequest({ email: 123 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "email is required" });
    expect(mockCheck).not.toHaveBeenCalled();
  });
});
