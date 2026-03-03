import { describe, expect, test } from "vitest";
import {
  circleSessionMembershipCreateInputSchema,
  circleSessionMembershipRoleUpdateInputSchema,
} from "@/server/presentation/dto/circle-session-membership";

const validBase = {
  circleSessionId: "session-1",
  userId: "user-1",
};

describe("circleSessionMembershipCreateInputSchema", () => {
  test("CircleSessionManagerを指定するとパースが成功する", () => {
    const result = circleSessionMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "CircleSessionManager",
    });
    expect(result.success).toBe(true);
  });

  test("CircleSessionMemberを指定するとパースが成功する", () => {
    const result = circleSessionMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "CircleSessionMember",
    });
    expect(result.success).toBe(true);
  });

  test("CircleSessionOwnerを指定するとバリデーションエラーになる", () => {
    const result = circleSessionMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "CircleSessionOwner",
    });
    expect(result.success).toBe(false);
  });

  test("不正な文字列を指定するとバリデーションエラーになる", () => {
    const result = circleSessionMembershipCreateInputSchema.safeParse({
      ...validBase,
      role: "InvalidRole",
    });
    expect(result.success).toBe(false);
  });
});

describe("circleSessionMembershipRoleUpdateInputSchema", () => {
  test("CircleSessionManagerを指定するとパースが成功する", () => {
    const result = circleSessionMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "CircleSessionManager",
    });
    expect(result.success).toBe(true);
  });

  test("CircleSessionMemberを指定するとパースが成功する", () => {
    const result = circleSessionMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "CircleSessionMember",
    });
    expect(result.success).toBe(true);
  });

  test("CircleSessionOwnerを指定するとバリデーションエラーになる", () => {
    const result = circleSessionMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "CircleSessionOwner",
    });
    expect(result.success).toBe(false);
  });

  test("不正な文字列を指定するとバリデーションエラーになる", () => {
    const result = circleSessionMembershipRoleUpdateInputSchema.safeParse({
      ...validBase,
      role: "InvalidRole",
    });
    expect(result.success).toBe(false);
  });
});
