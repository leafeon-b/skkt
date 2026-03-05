import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sanitizeCallbackUrl } from "./url";

describe("sanitizeCallbackUrl", () => {
  it("returns /home for undefined", () => {
    expect(sanitizeCallbackUrl(undefined)).toBe("/home");
  });

  it("returns /home for empty string", () => {
    expect(sanitizeCallbackUrl("")).toBe("/home");
  });

  it("allows a simple relative path", () => {
    expect(sanitizeCallbackUrl("/home")).toBe("/home");
  });

  it("allows a nested relative path", () => {
    expect(sanitizeCallbackUrl("/invite/abc123")).toBe("/invite/abc123");
  });

  it("allows a relative path with query parameters", () => {
    expect(sanitizeCallbackUrl("/invite/abc?foo=bar")).toBe(
      "/invite/abc?foo=bar",
    );
  });

  it("rejects an absolute URL", () => {
    expect(sanitizeCallbackUrl("https://evil.com")).toBe("/home");
  });

  it("rejects a protocol-relative URL", () => {
    expect(sanitizeCallbackUrl("//evil.com")).toBe("/home");
  });

  it("rejects a URL without protocol but with domain", () => {
    expect(sanitizeCallbackUrl("evil.com/path")).toBe("/home");
  });

  it("rejects javascript: protocol", () => {
    expect(sanitizeCallbackUrl("javascript:alert(1)")).toBe("/home");
  });

  it("rejects data: URI", () => {
    expect(sanitizeCallbackUrl("data:text/html,<h1>hi</h1>")).toBe("/home");
  });

  it("rejects control character bypass: tab between slashes", () => {
    expect(sanitizeCallbackUrl("/\t/evil.com")).toBe("/home");
  });

  it("rejects control character bypass: newline between slashes", () => {
    expect(sanitizeCallbackUrl("/\n/evil.com")).toBe("/home");
  });

  it("rejects control character bypass: carriage return between slashes", () => {
    expect(sanitizeCallbackUrl("/\r/evil.com")).toBe("/home");
  });

  it("rejects path traversal", () => {
    expect(sanitizeCallbackUrl("/../../../etc/passwd")).toBe("/home");
  });

  it("strips backslashes before validation", () => {
    expect(sanitizeCallbackUrl("/\\evil.com")).toBe("/evil.com");
  });

  describe("full URL handling", () => {
    const ORIGIN = "http://localhost:3000";

    beforeEach(() => {
      vi.stubGlobal("window", { location: { origin: ORIGIN } });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("extracts path from same-origin full URL", () => {
      expect(sanitizeCallbackUrl(`${ORIGIN}/invite/abc`)).toBe("/invite/abc");
    });

    it("extracts path with query parameters from same-origin full URL", () => {
      expect(sanitizeCallbackUrl(`${ORIGIN}/invite/abc?foo=bar`)).toBe(
        "/invite/abc?foo=bar",
      );
    });

    it("extracts path with hash from same-origin full URL", () => {
      expect(sanitizeCallbackUrl(`${ORIGIN}/home#section`)).toBe(
        "/home#section",
      );
    });

    it("rejects full URL from external origin", () => {
      expect(sanitizeCallbackUrl("https://evil.com/invite/abc")).toBe("/home");
    });

    it("rejects ftp:// scheme", () => {
      expect(sanitizeCallbackUrl("ftp://localhost:3000/path")).toBe("/home");
    });

    it("rejects same-origin URL with protocol-relative path (//evil.com)", () => {
      expect(sanitizeCallbackUrl(`${ORIGIN}//evil.com/steal`)).toBe("/home");
    });

    it("rejects full URL with different port", () => {
      expect(sanitizeCallbackUrl("http://localhost:4000/path")).toBe("/home");
    });
  });

  describe("full URL handling on server (no window)", () => {
    it("falls back to /home for full URL when window is undefined", () => {
      expect(sanitizeCallbackUrl("http://localhost:3000/invite/abc")).toBe(
        "/home",
      );
    });
  });
});
