import { beforeEach, describe, expect, test, vi } from "vitest";
import { appRouter } from "@/server/presentation/trpc/router";
import { toUserId } from "@/server/domain/common/ids";
import {
  createMockContext,
  createMockDeps,
  type MockDeps,
} from "@/server/test-utils/create-mock-deps";

const ACTOR_ID = toUserId("user-1");

const BASE_USER = {
  id: ACTOR_ID,
  name: "Taro",
  email: "taro@example.com",
  image: null,
  hasCustomImage: false,
  profileVisibility: "PUBLIC" as const,
  createdAt: new Date("2024-01-01"),
};

let mockDeps: MockDeps;

const buildContext = (actorId: ReturnType<typeof toUserId> | null = ACTOR_ID) =>
  createMockContext(actorId, mockDeps);

describe("user tRPC ルーター", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeps = createMockDeps();
  });

  describe("me", () => {
    test("ユーザー情報を meDtoSchema 準拠で返す", async () => {
      // getMe needs: userRepository.findById → user, userRepository.findPasswordHashById → hash
      mockDeps.userRepository.findById.mockResolvedValue(BASE_USER);
      mockDeps.userRepository.findPasswordHashById.mockResolvedValue("hashed-password");

      const caller = appRouter.createCaller(buildContext());
      const result = await caller.users.me();

      expect(result.id).toBe("user-1");
      expect(result.name).toBe("Taro");
      expect(result.email).toBe("taro@example.com");
      expect(result.hasPassword).toBe(true);
      expect(result.profileVisibility).toBe("PUBLIC");
    });

    test("ForbiddenError → FORBIDDEN", async () => {
      // getMe: userRepository.findById returns null → ForbiddenError
      mockDeps.userRepository.findById.mockResolvedValue(null);

      const caller = appRouter.createCaller(buildContext());

      await expect(caller.users.me()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("updateProfile", () => {
    test("BadRequestError → BAD_REQUEST", async () => {
      // updateProfile: user exists, has password (not OAuth), email already in use
      mockDeps.userRepository.findById.mockResolvedValue(BASE_USER);
      mockDeps.userRepository.findPasswordHashById.mockResolvedValue("hashed");
      mockDeps.userRepository.emailExists.mockResolvedValue(true);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.users.updateProfile({
          name: "Name",
          email: "taken@example.com",
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  describe("changePassword", () => {
    test("BadRequestError → BAD_REQUEST", async () => {
      // changePassword: rate limiter passes, password hash found, verify fails
      mockDeps.userRepository.findPasswordHashById.mockResolvedValue("hashed");
      mockDeps.passwordHasher.verify.mockReturnValue(false);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.users.changePassword({
          currentPassword: "wrongpass",
          newPassword: "newpass12",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    test("TooManyRequestsError → TOO_MANY_REQUESTS", async () => {
      // changePassword: rate limiter throws
      const { TooManyRequestsError } = await import(
        "@/server/domain/common/errors"
      );
      mockDeps.changePasswordRateLimiter.check.mockRejectedValue(
        new TooManyRequestsError(50_000),
      );

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.users.changePassword({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        }),
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    });
  });

  describe("updateProfileVisibility", () => {
    test("ForbiddenError → FORBIDDEN", async () => {
      // updateProfileVisibility: user not found → ForbiddenError
      mockDeps.userRepository.findById.mockResolvedValue(null);

      const caller = appRouter.createCaller(buildContext());

      await expect(
        caller.users.updateProfileVisibility({ visibility: "PRIVATE" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("未認証アクセス", () => {
    test("me: actorId null で UNAUTHORIZED を返す", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(caller.users.me()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    test("updateProfile: actorId null で UNAUTHORIZED を返す", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.users.updateProfile({
          name: "Name",
          email: "email@example.com",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    test("changePassword: actorId null で UNAUTHORIZED を返す", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.users.changePassword({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    test("updateProfileVisibility: actorId null で UNAUTHORIZED を返す", async () => {
      const caller = appRouter.createCaller(buildContext(null));

      await expect(
        caller.users.updateProfileVisibility({ visibility: "PRIVATE" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
