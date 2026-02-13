import { describe, expect, test } from "vitest";
import {
  circleSessionCreateInputSchema,
  circleSessionUpdateInputSchema,
} from "@/server/presentation/dto/circle-session";

const validBase = {
  circleId: "circle-1",
  startsAt: "2024-06-01T10:00:00Z",
  endsAt: "2024-06-01T12:00:00Z",
};

describe("circleSessionCreateInputSchema", () => {
  test("有効なタイトルでパースが成功する", () => {
    const result = circleSessionCreateInputSchema.safeParse({
      ...validBase,
      title: "第1回例会",
    });
    expect(result.success).toBe(true);
  });

  test("前後の空白がtrimされる", () => {
    const result = circleSessionCreateInputSchema.safeParse({
      ...validBase,
      title: "  合宿  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("合宿");
    }
  });

  test("空文字はバリデーションエラーになる", () => {
    const result = circleSessionCreateInputSchema.safeParse({
      ...validBase,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  test("空白のみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleSessionCreateInputSchema.safeParse({
      ...validBase,
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  test("100文字ちょうどは成功する", () => {
    const result = circleSessionCreateInputSchema.safeParse({
      ...validBase,
      title: "あ".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  test("101文字以上はバリデーションエラーになる", () => {
    const result = circleSessionCreateInputSchema.safeParse({
      ...validBase,
      title: "あ".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("circleSessionUpdateInputSchema", () => {
  const updateBase = {
    circleSessionId: "session-1",
  };

  test("title未指定でパースが成功する", () => {
    const result = circleSessionUpdateInputSchema.safeParse(updateBase);
    expect(result.success).toBe(true);
  });

  test("有効なタイトル指定でパースが成功する", () => {
    const result = circleSessionUpdateInputSchema.safeParse({
      ...updateBase,
      title: "第2回例会",
    });
    expect(result.success).toBe(true);
  });

  test("前後の空白がtrimされる", () => {
    const result = circleSessionUpdateInputSchema.safeParse({
      ...updateBase,
      title: "  合宿  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("合宿");
    }
  });

  test("空文字はバリデーションエラーになる", () => {
    const result = circleSessionUpdateInputSchema.safeParse({
      ...updateBase,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  test("空白のみはtrim後に空文字となりバリデーションエラーになる", () => {
    const result = circleSessionUpdateInputSchema.safeParse({
      ...updateBase,
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  test("100文字ちょうどは成功する", () => {
    const result = circleSessionUpdateInputSchema.safeParse({
      ...updateBase,
      title: "あ".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  test("101文字以上はバリデーションエラーになる", () => {
    const result = circleSessionUpdateInputSchema.safeParse({
      ...updateBase,
      title: "あ".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});
