import { beforeEach, describe, expect, test, vi } from "vitest";
import { createUserService } from "@/server/application/user/user-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import { createInMemoryUserRepository } from "@/server/infrastructure/repository/in-memory";
import type { UserStore } from "@/server/infrastructure/repository/in-memory/in-memory-user-repository";
import type { PasswordHasher } from "@/server/domain/common/password-hasher";
import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import { toUserId } from "@/server/domain/common/ids";
import {
  createUser,
  ProfileVisibility,
} from "@/server/domain/models/user/user";
import {
  ConflictError,
  TooManyRequestsError,
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

const addTestUser = (passwordHash: string | null = null) => {
  userStore.set(actorId, {
    ...testUser,
    passwordHash,
    passwordChangedAt: null,
  });
};

beforeEach(() => {
  userStore.clear();
  vi.clearAllMocks();
});

describe("getMe", () => {
  test("ユーザー情報とhasPasswordを返す", async () => {
    addTestUser("hashed:pass");

    const result = await service.getMe(actorId);

    expect(result.user).toEqual(testUser);
    expect(result.hasPassword).toBe(true);
  });

  test("パスワード未設定の場合 hasPassword=false", async () => {
    addTestUser(null);

    const result = await service.getMe(actorId);

    expect(result.hasPassword).toBe(false);
  });

  test("ユーザーが存在しない場合 Forbidden エラー", async () => {
    await expect(service.getMe(actorId)).rejects.toThrow("Forbidden");
  });
});

describe("updateProfile", () => {
  test("プロフィールを更新する", async () => {
    addTestUser("hashed:pass");

    await service.updateProfile(actorId, "NewName", "new@example.com");

    const stored = userStore.get(actorId);
    expect(stored?.name).toBe("NewName");
    expect(stored?.email).toBe("new@example.com");
  });

  test("メール重複時に ConflictError", async () => {
    addTestUser("hashed:pass");
    // 別のユーザーが同じメールを使用中
    userStore.set("other-user", {
      id: toUserId("other-user"),
      name: "Other",
      email: "taken@example.com",
      image: null,
      hasCustomImage: false,
      profileVisibility: "PUBLIC",
      createdAt: new Date(),
      passwordHash: null,
      passwordChangedAt: null,
    });

    await expect(
      service.updateProfile(actorId, "NewName", "taken@example.com"),
    ).rejects.toThrow(ConflictError);

    // ストアが変更されていないことを検証
    const stored = userStore.get(actorId);
    expect(stored?.name).toBe("Taro");
    expect(stored?.email).toBe("taro@example.com");
  });

  test("TOCTOU競合: リポジトリが ConflictError をスローした場合そのまま伝播する", async () => {
    addTestUser("hashed:pass");

    const originalUpdateProfile = userRepository.updateProfile;
    vi.spyOn(userRepository, "updateProfile").mockRejectedValueOnce(
      new ConflictError("Email already in use"),
    );

    await expect(
      service.updateProfile(actorId, "NewName", "new@example.com"),
    ).rejects.toThrow(ConflictError);

    userRepository.updateProfile = originalUpdateProfile;
  });

  test("OAuthユーザー（パスワード未設定）がメール変更を試みた場合 BadRequest エラー", async () => {
    addTestUser(null);

    await expect(
      service.updateProfile(actorId, "NewName", "new@example.com"),
    ).rejects.toThrow("OAuth users cannot change email");

    // ストアが変更されていないことを検証
    const stored = userStore.get(actorId);
    expect(stored?.name).toBe("Taro");
    expect(stored?.email).toBe("taro@example.com");
  });

  test("ユーザーが存在しない場合 Forbidden エラー", async () => {
    await expect(
      service.updateProfile(actorId, "Name", "email@example.com"),
    ).rejects.toThrow("Forbidden");
  });
});

describe("changePassword", () => {
  test("パスワードを変更する", async () => {
    addTestUser("hashed:oldpass");

    await service.changePassword(actorId, { currentPassword: "oldpass", newPassword: "newpass12", clientIp: "1.2.3.4" });

    const stored = userStore.get(actorId);
    expect(stored?.passwordHash).toBe("hashed:newpass12");
    expect(stored?.passwordChangedAt).toBeInstanceOf(Date);
  });

  test("現在のパスワードが不一致の場合 BadRequest エラー", async () => {
    addTestUser("hashed:correct");

    await expect(
      service.changePassword(actorId, { currentPassword: "wrong", newPassword: "newpass12", clientIp: "1.2.3.4" }),
    ).rejects.toThrow("Current password is incorrect");

    // パスワードが変更されていないことを検証
    const stored = userStore.get(actorId);
    expect(stored?.passwordHash).toBe("hashed:correct");
  });

  test("新パスワードが短い場合 BadRequest エラー", async () => {
    addTestUser("hashed:oldpass");

    await expect(
      service.changePassword(actorId, { currentPassword: "oldpass", newPassword: "short", clientIp: "1.2.3.4" }),
    ).rejects.toThrow("Password too short");

    const stored = userStore.get(actorId);
    expect(stored?.passwordHash).toBe("hashed:oldpass");
  });

  test("新パスワードが128文字の場合は許可される", async () => {
    addTestUser("hashed:oldpass");
    const maxPassword = "a".repeat(128);

    await service.changePassword(actorId, { currentPassword: "oldpass", newPassword: maxPassword, clientIp: "1.2.3.4" });

    const stored = userStore.get(actorId);
    expect(stored?.passwordHash).toBe(`hashed:${maxPassword}`);
  });

  test("新パスワードが128文字を超える場合 BadRequest エラー", async () => {
    addTestUser("hashed:oldpass");
    const longPassword = "a".repeat(129);

    await expect(
      service.changePassword(actorId, { currentPassword: "oldpass", newPassword: longPassword, clientIp: "1.2.3.4" }),
    ).rejects.toThrow("Password too long");

    const stored = userStore.get(actorId);
    expect(stored?.passwordHash).toBe("hashed:oldpass");
  });

  test("OAuthユーザー（パスワード未設定）の場合 BadRequest エラー", async () => {
    addTestUser(null);

    await expect(
      service.changePassword(actorId, { currentPassword: "any", newPassword: "newpass12", clientIp: "1.2.3.4" }),
    ).rejects.toThrow("Password login is not enabled");

    const stored = userStore.get(actorId);
    expect(stored?.passwordHash).toBeNull();
  });

  test("レート制限超過時に TooManyRequestsError", async () => {
    vi.mocked(changePasswordRateLimiter.check).mockImplementationOnce(() => {
      throw new TooManyRequestsError(50_000);
    });
    addTestUser("hashed:oldpass");

    await expect(
      service.changePassword(actorId, { currentPassword: "oldpass", newPassword: "newpass12", clientIp: "1.2.3.4" }),
    ).rejects.toThrow(TooManyRequestsError);

    // パスワードが変更されていないことを検証
    const stored = userStore.get(actorId);
    expect(stored?.passwordHash).toBe("hashed:oldpass");
  });

  test("パスワード不一致時に recordAttempt が呼ばれる", async () => {
    addTestUser("hashed:correct");

    await expect(
      service.changePassword(actorId, { currentPassword: "wrong", newPassword: "newpass12", clientIp: "1.2.3.4" }),
    ).rejects.toThrow("Current password is incorrect");

    expect(changePasswordRateLimiter.recordAttempt).toHaveBeenCalledWith(
      `${actorId}:1.2.3.4`,
    );
  });

  test("パスワード変更成功時に reset が呼ばれる", async () => {
    addTestUser("hashed:oldpass");

    await service.changePassword(actorId, { currentPassword: "oldpass", newPassword: "newpass12", clientIp: "1.2.3.4" });

    expect(changePasswordRateLimiter.reset).toHaveBeenCalledWith(
      `${actorId}:1.2.3.4`,
    );
  });
});

describe("updateProfileVisibility", () => {
  test("プロフィール公開設定を更新する", async () => {
    addTestUser();

    await service.updateProfileVisibility(actorId, ProfileVisibility.PRIVATE);

    const stored = userStore.get(actorId);
    expect(stored?.profileVisibility).toBe(ProfileVisibility.PRIVATE);
  });

  test("ユーザーが存在しない場合 Forbidden エラー", async () => {
    await expect(
      service.updateProfileVisibility(actorId, ProfileVisibility.PRIVATE),
    ).rejects.toThrow("Forbidden");
  });
});
