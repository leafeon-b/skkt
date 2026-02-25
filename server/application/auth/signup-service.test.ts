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
  passwordUtils: {
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

  test("createUser が ConflictError 以外をスローした場合はそのまま伝播する", async () => {
    const otherError = new Error("Database connection failed");
    const deps = createDeps({
      createUser: vi.fn().mockRejectedValue(otherError),
    });
    const service = createSignupService(deps);

    await expect(service.signup(validInput)).rejects.toThrow(otherError);
  });
});
