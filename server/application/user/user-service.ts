import type { User, ProfileVisibility } from "@/server/domain/models/user/user";
import type { UserId } from "@/server/domain/common/ids";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import type { PasswordHasher } from "@/server/domain/common/password-hasher";
import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import { BadRequestError, ForbiddenError } from "@/server/domain/common/errors";
import { USER_PASSWORD_MAX_LENGTH } from "@/server/domain/models/user/user";

const MIN_PASSWORD_LENGTH = 8;

type AccessService = ReturnType<typeof createAccessService>;

export type UserServiceDeps = {
  userRepository: UserRepository;
  accessService: AccessService;
  passwordHasher: PasswordHasher;
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
      const passwordHash =
        await deps.userRepository.findPasswordHashById(actorId);
      if (passwordHash === null) {
        throw new BadRequestError("OAuth users cannot change email");
      }

      const exists = await deps.userRepository.emailExists(email, actorId);
      if (exists) {
        throw new BadRequestError("Email already in use");
      }
    }

    await deps.userRepository.updateProfile(actorId, name, email);
  },

  async changePassword(
    actorId: UserId,
    params: {
      currentPassword: string;
      newPassword: string;
      clientIp: string;
    },
  ): Promise<void> {
    const { currentPassword, newPassword, clientIp } = params;
    const rateLimitKey = `${actorId}:${clientIp}`;
    await deps.changePasswordRateLimiter.check(rateLimitKey);

    const passwordHash =
      await deps.userRepository.findPasswordHashById(actorId);
    if (passwordHash === null) {
      throw new BadRequestError("Password login is not enabled");
    }

    const valid = deps.passwordHasher.verify(currentPassword, passwordHash);
    if (!valid) {
      await deps.changePasswordRateLimiter.recordFailure(rateLimitKey);
      throw new BadRequestError("Current password is incorrect");
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestError("Password too short");
    }

    if (newPassword.length > USER_PASSWORD_MAX_LENGTH) {
      throw new BadRequestError("Password too long");
    }

    await deps.changePasswordRateLimiter.reset(rateLimitKey);
    const newHash = deps.passwordHasher.hash(newPassword);
    const passwordChangedAt = new Date();
    await deps.userRepository.updatePasswordHash(
      actorId,
      newHash,
      passwordChangedAt,
    );
  },

  async updateProfileVisibility(
    actorId: UserId,
    visibility: ProfileVisibility,
  ): Promise<void> {
    const user = await deps.userRepository.findById(actorId);
    if (!user) {
      throw new ForbiddenError();
    }
    await deps.userRepository.updateProfileVisibility(actorId, visibility);
  },
});
