import type { User } from "@/server/domain/models/user/user";
import type { UserId } from "@/server/domain/common/ids";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import type { RateLimiter } from "@/server/application/common/rate-limiter";
import { BadRequestError, ForbiddenError } from "@/server/domain/common/errors";

const MIN_PASSWORD_LENGTH = 8;

type AccessService = ReturnType<typeof createAccessService>;

export type PasswordUtils = {
  hash(password: string): string;
  verify(password: string, hashedValue: string): boolean;
};

export type UserServiceDeps = {
  userRepository: UserRepository;
  accessService: AccessService;
  passwordUtils: PasswordUtils;
  changePasswordRateLimiter: RateLimiter;
};

export const createUserService = (deps: UserServiceDeps) => ({
  async getUser(actorId: string, id: UserId): Promise<User | null> {
    const allowed = await deps.accessService.canViewUser(actorId);
    if (!allowed) {
      throw new ForbiddenError();
    }
    return deps.userRepository.findById(id);
  },

  async listUsers(actorId: string, ids: readonly UserId[]): Promise<User[]> {
    const allowed = await deps.accessService.canViewUser(actorId);
    if (!allowed) {
      throw new ForbiddenError();
    }
    return deps.userRepository.findByIds(ids);
  },

  async getMe(actorId: UserId): Promise<{ user: User; hasPassword: boolean }> {
    const user = await deps.userRepository.findById(actorId);
    if (!user) {
      throw new ForbiddenError();
    }
    const passwordHash =
      await deps.userRepository.findPasswordHashById(actorId);
    return { user, hasPassword: passwordHash !== null };
  },

  async updateProfile(
    actorId: UserId,
    name: string | null,
    email: string | null,
  ): Promise<void> {
    const user = await deps.userRepository.findById(actorId);
    if (!user) {
      throw new ForbiddenError();
    }

    if (email !== null) {
      const exists = await deps.userRepository.emailExists(email, actorId);
      if (exists) {
        throw new BadRequestError("Email already in use");
      }
    }

    await deps.userRepository.updateProfile(actorId, name, email);
  },

  async changePassword(
    actorId: UserId,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    deps.changePasswordRateLimiter.check(actorId);

    const passwordHash =
      await deps.userRepository.findPasswordHashById(actorId);
    if (passwordHash === null) {
      throw new BadRequestError("Password login is not enabled");
    }

    const valid = deps.passwordUtils.verify(currentPassword, passwordHash);
    if (!valid) {
      deps.changePasswordRateLimiter.recordFailure(actorId);
      throw new BadRequestError("Current password is incorrect");
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestError("Password too short");
    }

    deps.changePasswordRateLimiter.reset(actorId);
    const newHash = deps.passwordUtils.hash(newPassword);
    await deps.userRepository.updatePasswordHash(actorId, newHash);
  },
});
