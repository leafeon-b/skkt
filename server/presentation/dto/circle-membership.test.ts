import { describe, expect, test } from "vitest";
import {
  circleMembershipCreateInputSchema,
  circleMembershipRoleUpdateInputSchema,
} from "@/server/presentation/dto/circle-membership";

const validBase = {
  circleId: "circle-1",
  userId: "user-1",
};

describe("circleMembershipCreateInputSchema", () => {
  test("CircleManagerを指定するとパースが成功する", () => {
    const result = circleMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "CircleManager",
    });
    expect(result.success).toBe(true);
  });

  test("CircleMemberを指定するとパースが成功する", () => {
    const result = circleMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "CircleMember",
    });
    expect(result.success).toBe(true);
  });

  test("CircleOwnerを指定するとバリデーションエラーになる", () => {
    const result = circleMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "CircleOwner",
    });
    expect(result.success).toBe(false);
  });

  test("不正な文字列を指定するとバリデーションエラーになる", () => {
    const result = circleMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "InvalidRole",
    });
    expect(result.success).toBe(false);
  });
});

describe("circleMembershipRoleUpdateInputSchema", () => {
  test("CircleManagerを指定するとパースが成功する", () => {
    const result = circleMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "CircleManager",
    });
    expect(result.success).toBe(true);
  });

  test("CircleMemberを指定するとパースが成功する", () => {
    const result = circleMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "CircleMember",
    });
    expect(result.success).toBe(true);
  });

  test("CircleOwnerを指定するとバリデーションエラーになる", () => {
    const result = circleMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "CircleOwner",
    });
    expect(result.success).toBe(false);
  });

  test("不正な文字列を指定するとバリデーションエラーになる", () => {
    const result = circleMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "InvalidRole",
    });
    expect(result.success).toBe(false);
  });
});
