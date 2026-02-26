import { afterEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

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

  test("style-src-elem に unsafe-inline が含まれない", () => {
    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy")!;
    const styleSrcElem = csp
      .split("; ")
      .find((d) => d.startsWith("style-src-elem "));

    expect(styleSrcElem).toBeDefined();
    expect(styleSrcElem).not.toContain("'unsafe-inline'");
  });

  test("style-src-elem に nonce が含まれる", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      FIXED_NONCE as `${string}-${string}-${string}-${string}-${string}`,
    );

    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy")!;
    const styleSrcElem = csp
      .split("; ")
      .find((d) => d.startsWith("style-src-elem "));

    expect(styleSrcElem).toBeDefined();
    expect(styleSrcElem).toContain(`'nonce-${FIXED_NONCE}'`);
  });

  test("style-src-attr は unsafe-inline を許可する", () => {
    const request = new NextRequest("http://localhost/");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy")!;
    const styleSrcAttr = csp
      .split("; ")
      .find((d) => d.startsWith("style-src-attr "));

    expect(styleSrcAttr).toBeDefined();
    expect(styleSrcAttr).toContain("'unsafe-inline'");
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
      "style-src ",
      "style-src-elem",
      "style-src-attr",
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
