import { describe, test, expect } from "vitest";
import { createUnsubscribeTokenService } from "./unsubscribe-token";

const secret = "test-secret";
const service = createUnsubscribeTokenService(secret);

describe("UnsubscribeTokenService", () => {
  test("生成したトークンを検証するとユーザーIDが返る", () => {
    const token = service.generate("user-123");
    const result = service.verify(token);
    expect(result).toBe("user-123");
  });

  test("異なるシークレットで生成されたトークンは検証に失敗する", () => {
    const otherService = createUnsubscribeTokenService("other-secret");
    const token = otherService.generate("user-123");
    const result = service.verify(token);
    expect(result).toBeNull();
  });

  test("不正なトークンは検証に失敗する", () => {
    expect(service.verify("invalid-token")).toBeNull();
    expect(service.verify("")).toBeNull();
  });

  test("改ざんされたトークンは検証に失敗する", () => {
    const token = service.generate("user-123");
    const tampered = token + "x";
    expect(service.verify(tampered)).toBeNull();
  });

  test("異なるユーザーIDで生成されたトークンは異なる", () => {
    const token1 = service.generate("user-1");
    const token2 = service.generate("user-2");
    expect(token1).not.toBe(token2);
  });
});
