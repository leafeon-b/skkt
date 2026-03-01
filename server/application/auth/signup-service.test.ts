import { describe, expect, test, vi } from "vitest";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import { userId } from "@/server/domain/common/ids";
import { ConflictError } from "@/server/domain/common/errors";
import {
  createSignupService,
  type SignupServiceDeps,
} from "@/server/application/auth/signup-service";

const validInput = {
  email: "test@example.com",
  password: "password123",
  name: "Test User",
  agreedToTerms: true,
};

const createDeps = (
  repoOverrides?: Partial<UserRepository>,
): SignupServiceDeps => ({
  userRepository: {
    emailExists: vi.fn().mockResolvedValue(false),
    createUser: vi.fn().mockResolvedValue(userId("new-user-id")),
    findById: vi.fn(),
    findByIds: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    updateProfile: vi.fn(),
    findPasswordHashById: vi.fn(),
    findPasswordChangedAt: vi.fn(),
    updatePasswordHash: vi.fn(),
    updateProfileVisibility: vi.fn(),
    ...repoOverrides,
  },
  passwordHasher: {
    hash: vi.fn().mockReturnValue("hashed-password"),
    verify: vi.fn(),
  },
});

describe("SignupService", () => {
  test("createUser が ConflictError をスローした場合 email_exists を返す", async () => {
    const deps = createDeps({
      createUser: vi
        .fn()
        .mockRejectedValue(new ConflictError("User already exists")),
    });
    const service = createSignupService(deps);

    const result = await service.signup(validInput);

    expect(result).toEqual({ success: false, error: "email_exists" });
  });

  test("agreedToTerms が false の場合 terms_not_agreed を返す", async () => {
    const deps = createDeps();
    const service = createSignupService(deps);

    const result = await service.signup({ ...validInput, agreedToTerms: false });

    expect(result).toEqual({ success: false, error: "terms_not_agreed" });
    expect(deps.userRepository.emailExists).not.toHaveBeenCalled();
  });

  test("パスワードが128文字を超える場合 password_too_long を返す", async () => {
    const deps = createDeps();
    const service = createSignupService(deps);
    const longPassword = "a".repeat(129);

    const result = await service.signup({ ...validInput, password: longPassword });

    expect(result).toEqual({ success: false, error: "password_too_long" });
    expect(deps.userRepository.emailExists).not.toHaveBeenCalled();
  });

  test("パスワードが128文字の場合は許可される", async () => {
    const deps = createDeps();
    const service = createSignupService(deps);
    const maxPassword = "a".repeat(128);

    const result = await service.signup({ ...validInput, password: maxPassword });

    expect(result).toEqual({ success: true, userId: userId("new-user-id") });
  });

  test("名前が50文字を超える場合 name_too_long を返す", async () => {
    const deps = createDeps();
    const service = createSignupService(deps);
    const longName = "あ".repeat(51);

    const result = await service.signup({ ...validInput, name: longName });

    expect(result).toEqual({ success: false, error: "name_too_long" });
    expect(deps.userRepository.emailExists).not.toHaveBeenCalled();
  });

  test("名前が50文字の場合は許可される", async () => {
    const deps = createDeps();
    const service = createSignupService(deps);
    const maxName = "あ".repeat(50);

    const result = await service.signup({ ...validInput, name: maxName });

    expect(result).toEqual({ success: true, userId: userId("new-user-id") });
  });

  test("名前がnullの場合は name_too_long チェックをスキップする", async () => {
    const deps = createDeps();
    const service = createSignupService(deps);

    const result = await service.signup({ ...validInput, name: null });

    expect(result).toEqual({ success: true, userId: userId("new-user-id") });
  });

  test("createUser が ConflictError 以外をスローした場合はそのまま伝播する", async () => {
    const otherError = new Error("Database connection failed");
    const deps = createDeps({
      createUser: vi.fn().mockRejectedValue(otherError),
    });
    const service = createSignupService(deps);

    await expect(service.signup(validInput)).rejects.toThrow(otherError);
  });
});
