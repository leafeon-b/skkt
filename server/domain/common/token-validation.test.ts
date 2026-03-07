import { describe, expect, it } from "vitest";
import { isValidUnsubscribeToken } from "./token-validation";

describe("isValidUnsubscribeToken", () => {
  it("有効なトークンを受け入れる", () => {
    expect(isValidUnsubscribeToken("a".repeat(20))).toBe(true);
    expect(isValidUnsubscribeToken("a".repeat(256))).toBe(true);
    expect(isValidUnsubscribeToken("ABCdef012_-abcdefghij")).toBe(true);
  });

  it("空文字を拒否する", () => {
    expect(isValidUnsubscribeToken("")).toBe(false);
  });

  it("短すぎるトークンを拒否する", () => {
    expect(isValidUnsubscribeToken("a".repeat(19))).toBe(false);
  });

  it("長すぎるトークンを拒否する", () => {
    expect(isValidUnsubscribeToken("a".repeat(257))).toBe(false);
  });

  it("許可されていない文字を含むトークンを拒否する", () => {
    expect(isValidUnsubscribeToken("a".repeat(19) + "!")).toBe(false);
    expect(isValidUnsubscribeToken("a".repeat(19) + " ")).toBe(false);
    expect(isValidUnsubscribeToken("a".repeat(19) + ".")).toBe(false);
  });
});
