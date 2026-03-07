import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("server/env", () => {
  let originalEnv: NodeJS.ProcessEnv;

  const requiredEnv: Record<string, string> = {
    DATABASE_URL: "postgresql://localhost:5432/test",
    NEXTAUTH_SECRET: "test-secret",
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    UNSUBSCRIBE_SECRET: "a".repeat(32),
  };

  const setEnv = (overrides: Record<string, string> = {}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 分割代入で VITEST を除外するために必要
    const { VITEST: _, ...clean } = { ...requiredEnv, ...overrides };
    process.env = clean as NodeJS.ProcessEnv;
  };

  beforeEach(() => {
    originalEnv = process.env;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("必須環境変数がすべて設定されていればパースに成功する", async () => {
    setEnv();
    const { env } = await import("./env");
    expect(env.DATABASE_URL).toBe(requiredEnv.DATABASE_URL);
  });

  test("DATABASE_URL が未設定の場合エラーをスローする", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 分割代入で DATABASE_URL を除外するために必要
    const { DATABASE_URL: _, ...rest } = requiredEnv;
    process.env = { ...rest } as NodeJS.ProcessEnv;
    await expect(import("./env")).rejects.toThrow(
      "Environment variable validation failed",
    );
  });

  test("UNSUBSCRIBE_SECRET が32文字未満の場合エラーをスローする", async () => {
    setEnv({ UNSUBSCRIBE_SECRET: "short" });
    await expect(import("./env")).rejects.toThrow(
      "Environment variable validation failed",
    );
  });

  test("本番環境で NEXTAUTH_URL が未設定の場合エラーをスローする", async () => {
    setEnv({ NODE_ENV: "production" });
    await expect(import("./env")).rejects.toThrow(
      "NEXTAUTH_URL environment variable is required in production",
    );
  });

  test("本番環境で NEXTAUTH_URL が設定済みの場合エラーにならない", async () => {
    setEnv({ NODE_ENV: "production", NEXTAUTH_URL: "https://example.com" });
    const { env } = await import("./env");
    expect(env.NEXTAUTH_URL).toBe("https://example.com");
  });

  test("本番環境で NEXTAUTH_URL が空白のみの場合エラーをスローする", async () => {
    setEnv({ NODE_ENV: "production", NEXTAUTH_URL: "   " });
    await expect(import("./env")).rejects.toThrow(
      "NEXTAUTH_URL environment variable is required in production",
    );
  });

  test("本番ビルドフェーズでは NEXTAUTH_URL 未設定でもエラーにならない", async () => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PHASE: "phase-production-build",
    });
    const { env } = await import("./env");
    expect(env.NEXTAUTH_URL).toBeUndefined();
  });

  test("開発環境で NEXTAUTH_URL が未設定でもエラーにならない", async () => {
    setEnv({ NODE_ENV: "development" });
    const { env } = await import("./env");
    expect(env.NEXTAUTH_URL).toBeUndefined();
  });

  test("オプショナル環境変数が未設定でもエラーにならない", async () => {
    setEnv();
    const { env } = await import("./env");
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.BASE_URL).toBeUndefined();
    expect(env.CRON_SECRET).toBeUndefined();
    expect(env.NEXT_PUBLIC_CONTACT_FORM_URL).toBeUndefined();
  });
});
