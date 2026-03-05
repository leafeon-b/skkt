import { describe, expect, test } from "vitest";
import { updateProfileInputSchema } from "@/server/presentation/dto/user";

describe("updateProfileInputSchema", () => {
  test("名前が50コードポイント以内の場合はバリデーション成功", () => {
    const result = updateProfileInputSchema.safeParse({
      name: "あ".repeat(50),
      email: "test@example.com",
    });

    expect(result.success).toBe(true);
  });

  test("名前が50コードポイントを超える場合はバリデーション失敗", () => {
    const result = updateProfileInputSchema.safeParse({
      name: "あ".repeat(51),
      email: "test@example.com",
    });

    expect(result.success).toBe(false);
  });

  test("絵文字を含む名前が50コードポイント以内の場合はバリデーション成功", () => {
    // 🎉 is 1 codepoint but 2 UTF-16 code units (String.length === 2)
    const result = updateProfileInputSchema.safeParse({
      name: "🎉".repeat(50),
      email: "test@example.com",
    });

    expect(result.success).toBe(true);
  });

  test("絵文字を含む名前が50コードポイントを超える場合はバリデーション失敗", () => {
    const result = updateProfileInputSchema.safeParse({
      name: "🎉".repeat(51),
      email: "test@example.com",
    });

    expect(result.success).toBe(false);
  });
});
