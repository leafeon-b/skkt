import { describe, expect, test } from "vitest";
import { toUserDto } from "@/server/presentation/mappers/user-mapper";
import { createUser } from "@/server/domain/models/user/user";
import { toUserId } from "@/server/domain/common/ids";

describe("toUserDto アバターURL", () => {
  test("hasCustomImage=true のとき /api/avatar/{id} を返す", () => {
    const user = createUser({
      id: toUserId("user-1"),
      hasCustomImage: true,
      image: "https://example.com/oauth-image.png",
    });

    const dto = toUserDto(user);

    expect(dto.image).toBe("/api/avatar/user-1");
  });

  test("hasCustomImage=false かつ OAuth画像URLありのとき、そのURLを返す", () => {
    const user = createUser({
      id: toUserId("user-2"),
      hasCustomImage: false,
      image: "https://example.com/oauth-image.png",
    });

    const dto = toUserDto(user);

    expect(dto.image).toBe("https://example.com/oauth-image.png");
  });

  test("hasCustomImage=false かつ imageが空白文字のみのとき null を返す", () => {
    const user = createUser({
      id: toUserId("user-4"),
      hasCustomImage: false,
      image: "   ",
    });

    const dto = toUserDto(user);

    expect(dto.image).toBeNull();
  });

  test("hasCustomImage=false かつ image=null のとき null を返す", () => {
    const user = createUser({
      id: toUserId("user-3"),
      hasCustomImage: false,
      image: null,
    });

    const dto = toUserDto(user);

    expect(dto.image).toBeNull();
  });
});
