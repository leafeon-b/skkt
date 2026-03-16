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

  test.each([
    {
      format: "PNG",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]),
      mimeType: "image/png",
    },
    {
      format: "JPEG",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]),
      mimeType: "image/jpeg",
    },
    {
      format: "WebP",
      buffer: Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
        0x50,
      ]),
      mimeType: "image/webp",
    },
    {
      format: "GIF",
      buffer: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x00, 0x00]),
      mimeType: "image/gif",
    },
  ])(
    "正当な$formatファイルがアップロード成功する",
    async ({ buffer, mimeType }) => {
      addTestUser();

      await service.uploadAvatar(actorId, buffer, mimeType);

      const stored = userStore.get(actorId);
      expect(stored?.imageData).toEqual(buffer);
      expect(stored?.imageMimeType).toBe(mimeType);
    },
  );

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

  test("クライアント提供MIMEタイプと実際のバイト内容が異なる場合、検出されたMIMEタイプで保存される", async () => {
    addTestUser();
    // JPEG magic bytes with PNG MIME type
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

    await service.uploadAvatar(actorId, jpegBuffer, "image/png");

    const stored = userStore.get(actorId);
    expect(stored?.imageData).toEqual(jpegBuffer);
    expect(stored?.imageMimeType).toBe("image/jpeg");
  });

  test.each([
    {
      format: "PNG",
      buffer: Buffer.from([0x89, 0x50, 0x4e]),
      mimeType: "image/png",
      minRequired: 4,
    },
    {
      format: "JPEG",
      buffer: Buffer.from([0xff, 0xd8]),
      mimeType: "image/jpeg",
      minRequired: 3,
    },
    {
      format: "WebP",
      buffer: Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
      ]),
      mimeType: "image/webp",
      minRequired: 12,
    },
    {
      format: "GIF",
      buffer: Buffer.from([0x47, 0x49, 0x46]),
      mimeType: "image/gif",
      minRequired: 4,
    },
  ])(
    "$format の最小必要バイト数($minRequired)未満のバッファで BadRequestError がスローされる",
    async ({ buffer, mimeType, minRequired }) => {
      addTestUser();
      expect(buffer.length).toBeLessThan(minRequired);

      await expect(
        service.uploadAvatar(actorId, buffer, mimeType),
      ).rejects.toThrow(BadRequestError);
    },
  );

  test("非WebP RIFFファイルが image/webp として拒否される", async () => {
    addTestUser();
    // RIFF....WAVE header (valid RIFF but not WebP)
    const wavBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);

    await expect(
      service.uploadAvatar(actorId, wavBuffer, "image/webp"),
    ).rejects.toThrow(BadRequestError);
  });

  test("どのシグネチャにも一致しないバイト列で BadRequestError がスローされる", async () => {
    addTestUser();
    const unknownBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    await expect(
      service.uploadAvatar(actorId, unknownBuffer, "image/png"),
    ).rejects.toThrow(BadRequestError);
  });
});
