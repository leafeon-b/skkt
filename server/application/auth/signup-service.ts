import type { UserId } from "@/server/domain/common/ids";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { PasswordHasher } from "@/server/domain/common/password-hasher";
import { ConflictError } from "@/server/domain/common/errors";
import {
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
} from "@/server/domain/models/user/user";

const MIN_PASSWORD_LENGTH = 8;

export type SignupServiceDeps = {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
};

export type SignupInput = {
  email: string;
  password: string;
  name: string | null;
  agreedToTerms: boolean;
};

export type SignupResult =
  | { success: true; userId: UserId }
  | {
      success: false;
      error:
        | "terms_not_agreed"
        | "invalid_email"
        | "password_too_short"
        | "password_too_long"
        | "name_too_long"
        | "signup_failed";
    };

export const createSignupService = (deps: SignupServiceDeps) => ({
  async signup(input: SignupInput): Promise<SignupResult> {
    if (input.agreedToTerms !== true) {
      return { success: false, error: "terms_not_agreed" };
    }

    const email = input.email.trim();
    const password = input.password;
    const name = input.name?.trim() || null;

    if (!email || !email.includes("@")) {
      return { success: false, error: "invalid_email" };
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: "password_too_short" };
    }

    if (password.length > USER_PASSWORD_MAX_LENGTH) {
      return { success: false, error: "password_too_long" };
    }

    if (name !== null && [...name].length > USER_NAME_MAX_LENGTH) {
      return { success: false, error: "name_too_long" };
    }

    const exists = await deps.userRepository.emailExists(email);
    if (exists) {
      return { success: false, error: "signup_failed" };
    }

    const passwordHash = deps.passwordHasher.hash(password);

    try {
      const userId = await deps.userRepository.createUser({
        email,
        passwordHash,
        name,
      });

      return { success: true, userId };
    } catch (error) {
      if (error instanceof ConflictError) {
        return { success: false, error: "signup_failed" };
      }
      throw error;
    }
  },
});
