import type { UserId } from "@/server/domain/common/ids";
import type { SignupRepository } from "@/server/domain/models/user/signup-repository";

const MIN_PASSWORD_LENGTH = 8;

export type SignupServiceDeps = {
  signupRepository: SignupRepository;
};

export type SignupInput = {
  email: string;
  password: string;
  name: string | null;
};

export type SignupResult =
  | { success: true; userId: UserId }
  | {
      success: false;
      error: "invalid_email" | "password_too_short" | "email_exists";
    };

export const createSignupService = (deps: SignupServiceDeps) => ({
  async signup(input: SignupInput): Promise<SignupResult> {
    const email = input.email.trim();
    const password = input.password;
    const name = input.name?.trim() || null;

    if (!email || !email.includes("@")) {
      return { success: false, error: "invalid_email" };
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: "password_too_short" };
    }

    const exists = await deps.signupRepository.emailExists(email);
    if (exists) {
      return { success: false, error: "email_exists" };
    }

    const userId = await deps.signupRepository.createUser({
      email,
      password,
      name,
    });

    return { success: true, userId };
  },
});
