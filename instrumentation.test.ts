import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("instrumentation register()", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("本番環境で NEXTAUTH_URL が未設定の場合エラーをスローする", async () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.NEXTAUTH_URL;

    const { register } = await import("./instrumentation");
    expect(() => register()).toThrow(
      "NEXTAUTH_URL environment variable is required in production",
    );
  });

  test("本番環境で NEXTAUTH_URL が設定済みの場合エラーにならない", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      NEXTAUTH_URL: "https://example.com",
    };

    const { register } = await import("./instrumentation");
    expect(() => register()).not.toThrow();
  });

  test("本番環境で NEXTAUTH_URL が空文字の場合エラーをスローする", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      NEXTAUTH_URL: "",
    };

    const { register } = await import("./instrumentation");
    expect(() => register()).toThrow(
      "NEXTAUTH_URL environment variable is required in production",
    );
  });

  test("本番環境で NEXTAUTH_URL が空白のみの場合エラーをスローする", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      NEXTAUTH_URL: "   ",
    };

    const { register } = await import("./instrumentation");
    expect(() => register()).toThrow(
      "NEXTAUTH_URL environment variable is required in production",
    );
  });

  test("開発環境で NEXTAUTH_URL が未設定でもエラーにならない", async () => {
    process.env = { ...originalEnv, NODE_ENV: "development" };
    delete process.env.NEXTAUTH_URL;

    const { register } = await import("./instrumentation");
    expect(() => register()).not.toThrow();
  });

  test("テスト環境で NEXTAUTH_URL が未設定でもエラーにならない", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    delete process.env.NEXTAUTH_URL;

    const { register } = await import("./instrumentation");
    expect(() => register()).not.toThrow();
  });
});
