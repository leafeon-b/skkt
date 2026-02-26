import { describe, expect, test } from "vitest";
import {
  assertDifferentIds,
  assertMaxLength,
  assertNonEmpty,
  assertPositiveInteger,
  assertStartBeforeEnd,
  assertValidDate,
} from "@/server/domain/common/validation";
import { BadRequestError } from "@/server/domain/common/errors";

describe("バリデーション", () => {
  test("assertNonEmpty は空文字（空白のみ）でエラー", () => {
    expect(() => assertNonEmpty(" ", "name")).toThrow(BadRequestError);
    expect(() => assertNonEmpty(" ", "name")).toThrow("name is required");
  });

  test("assertNonEmpty は空文字（長さ0）でエラー", () => {
    expect(() => assertNonEmpty("", "name")).toThrow("name is required");
  });

  test("assertNonEmpty はトリム後の値を返す", () => {
    expect(assertNonEmpty("  ok  ", "name")).toBe("ok");
  });

  test("assertMaxLength は最大長を超えるとエラー", () => {
    expect(() => assertMaxLength("abcdef", 5, "title")).toThrow(
      BadRequestError,
    );
    expect(() => assertMaxLength("abcdef", 5, "title")).toThrow(
      "title must be at most 5 characters",
    );
  });

  test("assertMaxLength は最大長ちょうどなら成功する", () => {
    expect(assertMaxLength("abcde", 5, "title")).toBe("abcde");
  });

  test("assertMaxLength は最大長未満なら成功する", () => {
    expect(assertMaxLength("abc", 5, "title")).toBe("abc");
  });

  test("assertPositiveInteger は正の整数で値を返す", () => {
    expect(assertPositiveInteger(3, "count")).toBe(3);
  });

  test("assertPositiveInteger は0でエラー", () => {
    expect(() => assertPositiveInteger(0, "count")).toThrow(BadRequestError);
    expect(() => assertPositiveInteger(0, "count")).toThrow(
      "count must be a positive integer",
    );
  });

  test("assertPositiveInteger は小数でエラー", () => {
    expect(() => assertPositiveInteger(1.2, "count")).toThrow(
      "count must be a positive integer",
    );
  });

  test("assertPositiveInteger は負の整数でエラー", () => {
    expect(() => assertPositiveInteger(-1, "count")).toThrow(
      "count must be a positive integer",
    );
  });

  test("assertValidDate は有効な日付を返す", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    expect(assertValidDate(date, "createdAt")).toBe(date);
  });

  test("assertValidDate は不正な日付でエラー", () => {
    expect(() => assertValidDate(new Date("invalid"), "createdAt")).toThrow(
      BadRequestError,
    );
    expect(() => assertValidDate(new Date("invalid"), "createdAt")).toThrow(
      "createdAt must be a valid date",
    );
  });

  test("assertStartBeforeEnd は開始が後ならエラー", () => {
    const startsAt = new Date("2024-01-02T00:00:00Z");
    const endsAt = new Date("2024-01-01T00:00:00Z");
    expect(() => assertStartBeforeEnd(startsAt, endsAt, "session")).toThrow(
      BadRequestError,
    );
    expect(() => assertStartBeforeEnd(startsAt, endsAt, "session")).toThrow(
      "session start must be before or equal to end",
    );
  });

  test("assertStartBeforeEnd は同一時刻ならエラーにならない", () => {
    const at = new Date("2024-01-01T00:00:00Z");
    expect(() => assertStartBeforeEnd(at, at, "session")).not.toThrow();
  });

  test("assertStartBeforeEnd は開始が終了より前なら成功する", () => {
    const startsAt = new Date("2024-01-01T00:00:00Z");
    const endsAt = new Date("2024-01-02T00:00:00Z");
    expect(() =>
      assertStartBeforeEnd(startsAt, endsAt, "session"),
    ).not.toThrow();
  });

  test("assertDifferentIds は同一でエラー", () => {
    expect(() => assertDifferentIds("id", "id", "target")).toThrow(
      BadRequestError,
    );
    expect(() => assertDifferentIds("id", "id", "target")).toThrow(
      "target must be different",
    );
  });

  test("assertDifferentIds は異なるときにエラーにならない", () => {
    expect(() => assertDifferentIds("id-1", "id-2", "target")).not.toThrow();
  });
});
