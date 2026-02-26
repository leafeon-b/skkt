import { afterEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { matcherSource, middleware } from "./middleware";

const FIXED_NONCE = "test-nonce-00000000-0000-0000-0000";

describe("middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("nonce が生成され CSP ヘッダーに埋め込まれる", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      FIXED_NONCE as `${string}-${string}-${string}-${string}-${string}`,
    );

    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toContain(`'nonce-${FIXED_NONCE}'`);
  });

  test("x-nonce リクエストヘッダーが設定される", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      FIXED_NONCE as `${string}-${string}-${string}-${string}-${string}`,
    );

    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    // NextResponse.next({ request: { headers } }) は内部で
    // x-middleware-request-<name> ヘッダーとしてリクエストヘッダーを転送する
    const xNonce = response.headers.get("x-middleware-request-x-nonce");
    expect(xNonce).toBe(FIXED_NONCE);
  });

  test("リクエストごとに異なる nonce が生成される", () => {
    const request1 = new NextRequest("http://localhost/");
    const request2 = new NextRequest("http://localhost/");
    const response1 = middleware(request1);
    const response2 = middleware(request2);

    const nonce1 = response1.headers.get("x-middleware-request-x-nonce");
    const nonce2 = response2.headers.get("x-middleware-request-x-nonce");

    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);
  });

  test("script-src に unsafe-inline が含まれない", () => {
    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy")!;
    const scriptSrc = csp
      .split("; ")
      .find((d) => d.startsWith("script-src"));

    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  test("レスポンスヘッダーに Content-Security-Policy が設定される", () => {
    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    expect(response.headers.has("Content-Security-Policy")).toBe(true);
  });

  test("全 CSP ディレクティブが正しく構築される", () => {
    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy")!;
    const directives = csp.split("; ");

    const expectedPrefixes = [
      "default-src",
      "script-src",
      "style-src",
      "img-src",
      "font-src",
      "connect-src",
      "form-action",
      "frame-ancestors",
      "base-uri",
      "frame-src",
      "object-src",
      "upgrade-insecure-requests",
    ];

    for (const prefix of expectedPrefixes) {
      expect(directives.some((d) => d.startsWith(prefix))).toBe(true);
    }
  });
});

describe("matcherSource", () => {
  // matcherSource をそのまま正規表現として使い、パスがマッチするかを検証する
  // Next.js は内部でこのパターンを path-to-regexp で処理するが、
  // 本パターンは標準正規表現としても有効
  const matcherRegex = new RegExp(`^${matcherSource}$`);

  function isMatched(pathname: string): boolean {
    return matcherRegex.test(pathname);
  }

  test("API ルート /api/trpc/* が除外される", () => {
    expect(isMatched("/api/trpc/circles.list")).toBe(false);
    expect(isMatched("/api/trpc/users.me")).toBe(false);
  });

  test("API ルート /api/auth/* が除外される", () => {
    expect(isMatched("/api/auth/signin")).toBe(false);
    expect(isMatched("/api/auth/callback/google")).toBe(false);
  });

  test("末尾スラッシュなしの /api はマッチする（API ルートは常に /api/ 配下）", () => {
    expect(isMatched("/api")).toBe(true);
  });

  test("api プレフィックスを含むが API ルートではないパスはマッチする", () => {
    expect(isMatched("/api-docs")).toBe(true);
  });

  test("通常のページルートはマッチする", () => {
    expect(isMatched("/")).toBe(true);
    expect(isMatched("/circles")).toBe(true);
    expect(isMatched("/circles/demo/sessions")).toBe(true);
  });

  test("静的アセットは除外される（既存動作の確認）", () => {
    expect(isMatched("/_next/static/chunks/main.js")).toBe(false);
    expect(isMatched("/_next/image")).toBe(false);
    expect(isMatched("/favicon.ico")).toBe(false);
  });
});
