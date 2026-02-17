import { beforeEach, describe, expect, test, vi } from "vitest";
import { createUserService } from "@/server/application/user/user-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { PasswordUtils } from "@/server/application/user/user-service";
import type { RateLimiter } from "@/server/application/common/rate-limiter";
import { userId } from "@/server/domain/common/ids";
import { createUser } from "@/server/domain/models/user/user";
import { TooManyRequestsError } from "@/server/domain/common/errors";

const userRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  save: vi.fn(),
  updateProfile: vi.fn(),
  emailExists: vi.fn(),
  findPasswordHashById: vi.fn(),
  findPasswordChangedAt: vi.fn(),
  updatePasswordHash: vi.fn(),
} satisfies UserRepository;

const accessService = createAccessServiceStub();

const passwordUtils: PasswordUtils = {
  hash: vi.fn((p: string) => `hashed:${p}`),
  verify: vi.fn((p: string, h: string) => h === `hashed:${p}`),
};

const changePasswordRateLimiter: RateLimiter = {
  check: vi.fn(),
  recordFailure: vi.fn(),
  reset: vi.fn(),
};

const service = createUserService({
  userRepository,
  accessService,
  passwordUtils,
  changePasswordRateLimiter,
});

const actorId = userId("user-1");
const testUser = createUser({
  id: actorId,
  name: "Taro",
  email: "taro@example.com",
  createdAt: new Date("2024-01-01"),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMe", () => {
  test("ユーザー情報とhasPasswordを返す", async () => {
    userRepository.findById.mockResolvedValue(testUser);
    userRepository.findPasswordHashById.mockResolvedValue("hashed:pass");

    const result = await service.getMe(actorId);

    expect(result.user).toEqual(testUser);
    expect(result.hasPassword).toBe(true);
  });

  test("パスワード未設定の場合 hasPassword=false", async () => {
    userRepository.findById.mockResolvedValue(testUser);
    userRepository.findPasswordHashById.mockResolvedValue(null);

    const result = await service.getMe(actorId);

    expect(result.hasPassword).toBe(false);
  });

  test("ユーザーが存在しない場合 Forbidden エラー", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(service.getMe(actorId)).rejects.toThrow("Forbidden");
  });
});

describe("updateProfile", () => {
  test("プロフィールを更新する", async () => {
    userRepository.findById.mockResolvedValue(testUser);
    userRepository.emailExists.mockResolvedValue(false);

    await service.updateProfile(actorId, "NewName", "new@example.com");

    expect(userRepository.updateProfile).toHaveBeenCalledWith(
      actorId,
      "NewName",
      "new@example.com",
    );
  });

  test("メールがnullの場合はメール重複チェックをスキップ", async () => {
    userRepository.findById.mockResolvedValue(testUser);

    await service.updateProfile(actorId, "NewName", null);

    expect(userRepository.emailExists).not.toHaveBeenCalled();
    expect(userRepository.updateProfile).toHaveBeenCalledWith(
      actorId,
      "NewName",
      null,
    );
  });

  test("メール重複時に BadRequest エラー", async () => {
    userRepository.findById.mockResolvedValue(testUser);
    userRepository.emailExists.mockResolvedValue(true);

    await expect(
      service.updateProfile(actorId, "NewName", "taken@example.com"),
    ).rejects.toThrow("Email already in use");

    expect(userRepository.updateProfile).not.toHaveBeenCalled();
  });

  test("name=null, email=null の場合はメール重複チェックをスキップして更新する", async () => {
    userRepository.findById.mockResolvedValue(testUser);

    await service.updateProfile(actorId, null, null);

    expect(userRepository.emailExists).not.toHaveBeenCalled();
    expect(userRepository.updateProfile).toHaveBeenCalledWith(
      actorId,
      null,
      null,
    );
  });

  test("ユーザーが存在しない場合 Forbidden エラー", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateProfile(actorId, "Name", "email@example.com"),
    ).rejects.toThrow("Forbidden");
  });
});

describe("changePassword", () => {
  test("パスワードを変更する", async () => {
    userRepository.findPasswordHashById.mockResolvedValue("hashed:oldpass");

    await service.changePassword(actorId, "oldpass", "newpass12");

    expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(
      actorId,
      "hashed:newpass12",
    );
  });

  test("現在のパスワードが不一致の場合 BadRequest エラー", async () => {
    userRepository.findPasswordHashById.mockResolvedValue("hashed:correct");

    await expect(
      service.changePassword(actorId, "wrong", "newpass12"),
    ).rejects.toThrow("Current password is incorrect");

    expect(userRepository.updatePasswordHash).not.toHaveBeenCalled();
  });

  test("新パスワードが短い場合 BadRequest エラー", async () => {
    userRepository.findPasswordHashById.mockResolvedValue("hashed:oldpass");

    await expect(
      service.changePassword(actorId, "oldpass", "short"),
    ).rejects.toThrow("Password too short");

    expect(userRepository.updatePasswordHash).not.toHaveBeenCalled();
  });

  test("OAuthユーザー（パスワード未設定）の場合 BadRequest エラー", async () => {
    userRepository.findPasswordHashById.mockResolvedValue(null);

    await expect(
      service.changePassword(actorId, "any", "newpass12"),
    ).rejects.toThrow("Password login is not enabled");

    expect(userRepository.updatePasswordHash).not.toHaveBeenCalled();
  });

  test("レート制限超過時に TooManyRequestsError", async () => {
    vi.mocked(changePasswordRateLimiter.check).mockImplementationOnce(() => {
      throw new TooManyRequestsError();
    });

    await expect(
      service.changePassword(actorId, "oldpass", "newpass12"),
    ).rejects.toThrow(TooManyRequestsError);

    expect(userRepository.findPasswordHashById).not.toHaveBeenCalled();
  });

  test("パスワード不一致時に recordFailure が呼ばれる", async () => {
    userRepository.findPasswordHashById.mockResolvedValue("hashed:correct");

    await expect(
      service.changePassword(actorId, "wrong", "newpass12"),
    ).rejects.toThrow("Current password is incorrect");

    expect(changePasswordRateLimiter.recordFailure).toHaveBeenCalledWith(
      actorId,
    );
  });

  test("パスワード変更成功時に reset が呼ばれる", async () => {
    userRepository.findPasswordHashById.mockResolvedValue("hashed:oldpass");

    await service.changePassword(actorId, "oldpass", "newpass12");

    expect(changePasswordRateLimiter.reset).toHaveBeenCalledWith(actorId);
  });
});
