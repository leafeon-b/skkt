import { describe, expect, test, vi } from "vitest";
import { createInMemoryUserRepository } from "@/server/infrastructure/repository/in-memory";
import type { UserStore } from "@/server/infrastructure/repository/in-memory/in-memory-user-repository";
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
  userStore: UserStore = new Map(),
): { deps: SignupServiceDeps; userStore: UserStore } => {
  const userRepository = createInMemoryUserRepository(userStore);
  return {
    deps: {
      userRepository,
      passwordHasher: {
        hash: vi.fn().mockReturnValue("hashed-password"),
        verify: vi.fn(),
      },
    },
    userStore,
  };
};

describe("SignupService", () => {
  test("createUser が ConflictError をスローした場合 email_exists を返す", async () => {
    const { deps } = createDeps();
    // createUser を差し替えてレースコンディション（emailExists通過後のConflictError）を再現
    deps.userRepository.createUser = async () => {
      throw new ConflictError("User already exists");
    };
    const service = createSignupService(deps);

    const result = await service.signup(validInput);

    expect(result).toEqual({ success: false, error: "email_exists" });
  });

  test("agreedToTerms が false の場合 terms_not_agreed を返す", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);

    const result = await service.signup({
      ...validInput,
      agreedToTerms: false,
    });

    expect(result).toEqual({ success: false, error: "terms_not_agreed" });
    expect(userStore.size).toBe(0);
  });

  test("パスワードが128文字を超える場合 password_too_long を返す", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);
    const longPassword = "a".repeat(129);

    const result = await service.signup({
      ...validInput,
      password: longPassword,
    });

    expect(result).toEqual({ success: false, error: "password_too_long" });
    expect(userStore.size).toBe(0);
  });

  test("パスワードが128文字の場合は許可される", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);
    const maxPassword = "a".repeat(128);

    const result = await service.signup({
      ...validInput,
      password: maxPassword,
    });

    expect(result).toEqual({ success: true, userId: expect.any(String) });
    expect(userStore.size).toBe(1);
  });

  test("名前が50文字を超える場合 name_too_long を返す", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);
    const longName = "あ".repeat(51);

    const result = await service.signup({ ...validInput, name: longName });

    expect(result).toEqual({ success: false, error: "name_too_long" });
    expect(userStore.size).toBe(0);
  });

  test("名前が50文字の場合は許可される", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);
    const maxName = "あ".repeat(50);

    const result = await service.signup({ ...validInput, name: maxName });

    expect(result).toEqual({ success: true, userId: expect.any(String) });
    expect(userStore.size).toBe(1);
  });

  test("絵文字を含む名前が50コードポイント以内の場合は許可される", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);
    // 🎉 is 1 codepoint but 2 UTF-16 code units (String.length === 2)
    const nameWithEmoji = "🎉".repeat(50);

    const result = await service.signup({ ...validInput, name: nameWithEmoji });

    expect(result).toEqual({ success: true, userId: expect.any(String) });
    expect(userStore.size).toBe(1);
  });

  test("絵文字を含む名前が50コードポイントを超える場合 name_too_long を返す", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);
    const nameWithEmoji = "🎉".repeat(51);

    const result = await service.signup({ ...validInput, name: nameWithEmoji });

    expect(result).toEqual({ success: false, error: "name_too_long" });
    expect(userStore.size).toBe(0);
  });

  test("名前がnullの場合は name_too_long チェックをスキップする", async () => {
    const { deps, userStore } = createDeps();
    const service = createSignupService(deps);

    const result = await service.signup({ ...validInput, name: null });

    expect(result).toEqual({ success: true, userId: expect.any(String) });
    expect(userStore.size).toBe(1);
  });

  test("createUser が ConflictError 以外をスローした場合はそのまま伝播する", async () => {
    const { deps } = createDeps();
    const otherError = new Error("Database connection failed");
    deps.userRepository.createUser = async () => {
      throw otherError;
    };
    const service = createSignupService(deps);

    await expect(service.signup(validInput)).rejects.toThrow(otherError);
  });
});
