import { describe, expect, test } from "vitest";
import {
  circleCreateInputSchema,
  circleRenameInputSchema,
} from "@/server/presentation/dto/circle";
import { CIRCLE_NAME_MAX_LENGTH } from "@/server/domain/models/circle/circle";

describe("circleCreateInputSchema", () => {
  test("有効な名前でパースが成功する", () => {
    const result = circleCreateInputSchema.safeParse({ name: "将棋研究会" });
    expect(result.success).toBe(true);
  });

  test("前後の空白がtrimされる", () => {
    const result = circleCreateInputSchema.safeParse({ name: "  将棋研究会  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("将棋研究会");
    }
  });

  test("空文字はバリデーションエラーになる", () => {
    const result = circleCreateInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  test("空白のみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleCreateInputSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  test("全角スペースのみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleCreateInputSchema.safeParse({ name: "\u3000\u3000\u3000" });
    expect(result.success).toBe(false);
  });

  test("半角・全角スペース混在のみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleCreateInputSchema.safeParse({ name: " \u3000 \u3000 " });
    expect(result.success).toBe(false);
  });

  test("前後の全角スペースがtrimされる", () => {
    const result = circleCreateInputSchema.safeParse({ name: "\u3000将棋研究会\u3000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("将棋研究会");
    }
  });

  test("50文字ちょうどは成功する", () => {
    const result = circleCreateInputSchema.safeParse({
      name: "あ".repeat(CIRCLE_NAME_MAX_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  test("51文字以上はバリデーションエラーになる", () => {
    const result = circleCreateInputSchema.safeParse({
      name: "あ".repeat(CIRCLE_NAME_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });
});

describe("circleRenameInputSchema", () => {
  const base = { circleId: "circle-1" };

  test("有効な名前でパースが成功する", () => {
    const result = circleRenameInputSchema.safeParse({
      ...base,
      name: "新しい研究会名",
    });
    expect(result.success).toBe(true);
  });

  test("前後の空白がtrimされる", () => {
    const result = circleRenameInputSchema.safeParse({
      ...base,
      name: "  新しい研究会名  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("新しい研究会名");
    }
  });

  test("空文字はバリデーションエラーになる", () => {
    const result = circleRenameInputSchema.safeParse({ ...base, name: "" });
    expect(result.success).toBe(false);
  });

  test("空白のみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleRenameInputSchema.safeParse({ ...base, name: "   " });
    expect(result.success).toBe(false);
  });

  test("全角スペースのみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleRenameInputSchema.safeParse({ ...base, name: "\u3000\u3000\u3000" });
    expect(result.success).toBe(false);
  });

  test("半角・全角スペース混在のみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleRenameInputSchema.safeParse({ ...base, name: " \u3000 \u3000 " });
    expect(result.success).toBe(false);
  });

  test("前後の全角スペースがtrimされる", () => {
    const result = circleRenameInputSchema.safeParse({ ...base, name: "\u3000新しい研究会名\u3000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("新しい研究会名");
    }
  });

  test("50文字ちょうどは成功する", () => {
    const result = circleRenameInputSchema.safeParse({
      ...base,
      name: "あ".repeat(CIRCLE_NAME_MAX_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  test("51文字以上はバリデーションエラーになる", () => {
    const result = circleRenameInputSchema.safeParse({
      ...base,
      name: "あ".repeat(CIRCLE_NAME_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });
});
