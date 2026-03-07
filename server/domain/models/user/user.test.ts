import { describe, expect, test } from "vitest";
import { toUserId } from "@/server/domain/common/ids";
import { createUser } from "@/server/domain/models/user/user";

describe("User ドメイン", () => {
  test("createUser は任意項目が未指定でも生成できる", () => {
    const user = createUser({
      id: toUserId("user-1"),
    });

    expect(user.name).toBeNull();
    expect(user.email).toBeNull();
    expect(user.image).toBeNull();
  });

  test("createUser は指定された値を保持する", () => {
    const createdAt = new Date("2024-01-01T00:00:00Z");
    const user = createUser({
      id: toUserId("user-2"),
      name: "Taro Yamada",
      email: "taro@example.com",
      image: "https://example.com/avatar.png",
      createdAt,
    });

    expect(user.name).toBe("Taro Yamada");
    expect(user.email).toBe("taro@example.com");
    expect(user.image).toBe("https://example.com/avatar.png");
    expect(user.createdAt).toBe(createdAt);
  });
});
