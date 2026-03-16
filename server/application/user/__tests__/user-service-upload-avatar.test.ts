import { beforeEach, describe, expect, test, vi } from "vitest";
import { createUserService } from "@/server/application/user/user-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import { createInMemoryUserRepository } from "@/server/infrastructure/repository/in-memory";
import type { UserStore } from "@/server/infrastructure/repository/in-memory/in-memory-user-repository";
import type { PasswordHasher } from "@/server/domain/common/password-hasher";
import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import { toUserId } from "@/server/domain/common/ids";
import { createUser } from "@/server/domain/models/user/user";
import {
  BadRequestError,
  ForbiddenError,
} from "@/server/domain/common/errors";

const userStore: UserStore = new Map();
const userRepository = createInMemoryUserRepository(userStore);

const accessService = createAccessServiceStub();

const passwordHasher: PasswordHasher = {
  hash: vi.fn((p: string) => `hashed:${p}`),
  verify: vi.fn((p: string, h: string) => h === `hashed:${p}`),
};

const changePasswordRateLimiter: RateLimiter = {
  check: vi.fn(),
  recordAttempt: vi.fn(),
  reset: vi.fn(),
};

const service = createUserService({
  userRepository,
  accessService,
  passwordHasher,
  changePasswordRateLimiter,
});

const actorId = toUserId("user-1");
const testUser = createUser({
  id: actorId,
  name: "Taro",
  email: "taro@example.com",
  createdAt: new Date("2024-01-01"),
});

const addTestUser = () => {
  userStore.set(actorId, {
    ...testUser,
    passwordHash: null,
    passwordChangedAt: null,
  });
};

beforeEach(() => {
  userStore.clear();
  vi.clearAllMocks();
});

describe("uploadAvatar", () => {
  // PNG magic bytes: 0x89 0x50 0x4E 0x47
  const validBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]);
  const validMimeType = "image/png";

  test("アップロード成功時にリポジトリにデータが保存される", async () => {
    addTestUser();

    await service.uploadAvatar(actorId, validBuffer, validMimeType);

    const stored = userStore.get(actorId);
    expect(stored?.imageData).toEqual(validBuffer);
    expect(stored?.imageMimeType).toBe(validMimeType);
  });

  test("存在しないユーザーで ForbiddenError がスローされる", async () => {
    await expect(
      service.uploadAvatar(actorId, validBuffer, validMimeType),
    ).rejects.toThrow(ForbiddenError);
  });

  test("ファイルサイズ超過（2MB超）で BadRequestError がスローされる", async () => {
    addTestUser();
    const largeBuffer = Buffer.alloc(2 * 1024 * 1024 + 1);

    await expect(
      service.uploadAvatar(actorId, largeBuffer, validMimeType),
    ).rejects.toThrow(BadRequestError);
  });

  test("不正なMIMEタイプで BadRequestError がスローされる", async () => {
    addTestUser();

    await expect(
      service.uploadAvatar(actorId, validBuffer, "text/plain"),
    ).rejects.toThrow(BadRequestError);
  });

  test("magic bytesが宣言されたMIMEタイプと一致しない場合 BadRequestError がスローされる", async () => {
    addTestUser();
    // JPEG magic bytes with PNG MIME type
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

    await expect(
      service.uploadAvatar(actorId, jpegBuffer, "image/png"),
    ).rejects.toThrow(BadRequestError);
  });
});
