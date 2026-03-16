import type { User, ProfileVisibility } from "@/server/domain/models/user/user";
import type { UserId } from "@/server/domain/common/ids";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import type { PasswordHasher } from "@/server/domain/common/password-hasher";
import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "@/server/domain/common/errors";
import { USER_PASSWORD_MAX_LENGTH } from "@/server/domain/models/user/user";

const MIN_PASSWORD_LENGTH = 8;
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type MagicBytesSegment = { offset: number; bytes: number[] };

const AVATAR_MAGIC_BYTES: Record<string, MagicBytesSegment[]> = {
  "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  "image/gif": [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
};

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
        throw new ConflictError("Email already in use");
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
      await deps.changePasswordRateLimiter.recordAttempt(rateLimitKey);
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

  async uploadAvatar(
    actorId: UserId,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    const user = await deps.userRepository.findById(actorId);
    if (!user) {
      throw new ForbiddenError();
    }

    if (fileBuffer.length > AVATAR_MAX_SIZE) {
      throw new BadRequestError("File size exceeds 2MB limit");
    }

    if (
      !AVATAR_ALLOWED_MIME_TYPES.includes(
        mimeType as (typeof AVATAR_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestError("Unsupported image format");
    }

    // Detect MIME type from magic bytes (scan all allowed types)
    let detectedMimeType: string | null = null;
    for (const [candidateMime, segments] of Object.entries(
      AVATAR_MAGIC_BYTES,
    )) {
      const minRequired = segments.reduce(
        (max, segment) => Math.max(max, segment.offset + segment.bytes.length),
        0,
      );
      if (fileBuffer.length < minRequired) continue;

      const matches = segments.every((segment) =>
        segment.bytes.every(
          (byte, index) => fileBuffer[segment.offset + index] === byte,
        ),
      );
      if (matches) {
        detectedMimeType = candidateMime;
        break;
      }
    }

    if (detectedMimeType === null) {
      throw new BadRequestError(
        "File content does not match any supported image format",
      );
    }

    await deps.userRepository.saveImageData(
      actorId,
      fileBuffer,
      detectedMimeType,
    );
  },

  async findImageData(
    userId: UserId,
  ): Promise<{ data: Buffer; mimeType: string } | null> {
    return deps.userRepository.findImageData(userId);
  },
});
