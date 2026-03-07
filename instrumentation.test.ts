import { describe, expect, test, vi } from "vitest";

vi.mock("@/server/env", () => ({ env: {} }));

describe("instrumentation register()", () => {
  test("register 関数がエクスポートされ呼び出し可能である", async () => {
    const { register } = await import("./instrumentation");
    expect(() => register()).not.toThrow();
  });
});
