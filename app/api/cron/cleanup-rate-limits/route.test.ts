import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/presentation/cron/rate-limit-cleanup", () => ({
  rateLimitCleanupService: {
    cleanupExpired: vi.fn(),
  },
}));

import { rateLimitCleanupService } from "@/server/presentation/cron/rate-limit-cleanup";
import { GET } from "./route";

const mockedCleanupService = vi.mocked(rateLimitCleanupService);

describe("GET /api/cron/cleanup-rate-limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret");
  });

  test("CRON_SECRETが未設定の場合は401を返す", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const request = new Request("http://localhost/api/cron/cleanup-rate-limits", {
      headers: { authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  test("Authorizationヘッダーなしの場合は401を返す", async () => {
    const request = new Request("http://localhost/api/cron/cleanup-rate-limits");

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  test("Authorizationヘッダーが不正な場合は401を返す", async () => {
    const request = new Request("http://localhost/api/cron/cleanup-rate-limits", {
      headers: { authorization: "Bearer wrong-secret" },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  test("DBエラー時に500を返す", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockedCleanupService.cleanupExpired.mockRejectedValueOnce(
      new Error("DB connection failed"),
    );

    const request = new Request("http://localhost/api/cron/cleanup-rate-limits", {
      headers: { authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({ error: "Internal Server Error" });

    consoleErrorSpy.mockRestore();
  });

  test("認証成功時に期限切れレコードを削除して件数を返す", async () => {
    mockedCleanupService.cleanupExpired.mockResolvedValueOnce(5);

    const request = new Request("http://localhost/api/cron/cleanup-rate-limits", {
      headers: { authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ deleted: 5 });
  });
});
