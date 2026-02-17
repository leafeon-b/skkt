import { afterEach, describe, expect, test, vi } from "vitest";
import type { JWT } from "next-auth/jwt";
import type { RateLimiter } from "@/server/application/common/rate-limiter";
import { TooManyRequestsError } from "@/server/domain/common/errors";
import type { UserRepository } from "@/server/domain/models/user/user-repository";

const prismaValue = vi.hoisted(() => ({
  prisma: {},
}));
const nextAuthMock = vi.hoisted(() => vi.fn());
const prismaAdapterMock = vi.hoisted(() => vi.fn());
const credentialsMock = vi.hoisted(() => vi.fn());
const googleMock = vi.hoisted(() => vi.fn());
const verifyPasswordMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/infrastructure/db", () => prismaValue);
vi.mock("next-auth", () => ({ default: nextAuthMock }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: prismaAdapterMock }));
vi.mock("next-auth/providers/credentials", () => ({
  default: credentialsMock,
}));
vi.mock("next-auth/providers/google", () => ({ default: googleMock }));
vi.mock("@/server/infrastructure/auth/password", () => ({
  verifyPassword: verifyPasswordMock,
}));

import { prisma } from "@/server/infrastructure/db";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {
  createAuthOptions,
  createNextAuthHandler,
} from "@/server/infrastructure/auth/nextauth-handler";

const createMockUserRepository = (
  overrides: Partial<UserRepository> = {},
): UserRepository => ({
  findById: vi.fn(),
  findByIds: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  updateProfile: vi.fn(),
  emailExists: vi.fn(),
  findPasswordHashById: vi.fn(),
  findPasswordChangedAt: vi.fn(),
  updatePasswordHash: vi.fn(),
  ...overrides,
});

const createMockRateLimiter = (
  overrides: Partial<RateLimiter> = {},
): RateLimiter => ({
  check: vi.fn(),
  recordFailure: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

const ORIGINAL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ORIGINAL_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

describe("NextAuth ハンドラ", () => {
  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = ORIGINAL_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = ORIGINAL_CLIENT_SECRET;
    vi.clearAllMocks();
  });

  test("PrismaAdapter と Google プロバイダを使って設定を生成する", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";

    const adapter = { kind: "adapter" } as unknown as ReturnType<
      typeof PrismaAdapter
    >;
    const credentialsProvider = {
      kind: "credentials-provider",
    } as unknown as ReturnType<typeof Credentials>;
    const provider = { kind: "google-provider" } as unknown as ReturnType<
      typeof Google
    >;
    vi.mocked(PrismaAdapter).mockReturnValue(adapter);
    vi.mocked(Credentials).mockReturnValue(credentialsProvider);
    vi.mocked(Google).mockReturnValue(provider);
    vi.mocked(NextAuth).mockReturnValue("handler");

    const mockRepo = createMockUserRepository();
    const handler = createNextAuthHandler({
      userRepository: mockRepo,
      loginRateLimiter: createMockRateLimiter(),
    });

    expect(handler).toBe("handler");
    expect(PrismaAdapter).toHaveBeenCalledWith(prisma);
    expect(Credentials).toHaveBeenCalledWith({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: expect.any(Function),
    });
    expect(Google).toHaveBeenCalledWith({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    expect(NextAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        adapter,
        providers: [credentialsProvider, provider],
        session: { strategy: "jwt" },
        debug: true,
        callbacks: {
          jwt: expect.any(Function),
          session: expect.any(Function),
        },
      }),
    );
  });
});

describe("JWT コールバック", () => {
  const mockRepo = createMockUserRepository();
  const options = createAuthOptions({
    userRepository: mockRepo,
    loginRateLimiter: createMockRateLimiter(),
  });
  const jwtCallback = options.callbacks!.jwt! as (params: {
    token: JWT;
    user?: { id: string };
  }) => Promise<JWT>;

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("初回ログイン時に token.id と token.iat を設定しDBクエリせず早期リターンする", async () => {
    const token = { sub: "user-1" } as JWT;
    const result = await jwtCallback({ token, user: { id: "user-1" } });

    expect(result.id).toBe("user-1");
    expect(result.iat).toBeDefined();
    expect(mockRepo.findPasswordChangedAt).not.toHaveBeenCalled();
  });

  test("passwordChangedAt が null の場合はトークンをそのまま返す", async () => {
    vi.mocked(mockRepo.findPasswordChangedAt).mockResolvedValue(null);

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const result = await jwtCallback({ token });

    expect(result.id).toBe("user-1");
  });

  test("passwordChangedAt が iat より前の場合はトークンをそのまま返す", async () => {
    vi.mocked(mockRepo.findPasswordChangedAt).mockResolvedValue(
      new Date(1699999000 * 1000),
    );

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const result = await jwtCallback({ token });

    expect(result.id).toBe("user-1");
  });

  test("passwordChangedAt が iat より後の場合は空トークンを返す（セッション無効化）", async () => {
    vi.mocked(mockRepo.findPasswordChangedAt).mockResolvedValue(
      new Date(1700001000 * 1000),
    );

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const result = await jwtCallback({ token });

    expect(result.id).toBeUndefined();
  });

  test("ユーザーが存在しない場合はトークンをそのまま返す", async () => {
    vi.mocked(mockRepo.findPasswordChangedAt).mockResolvedValue(null);

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const result = await jwtCallback({ token });

    expect(result.id).toBe("user-1");
  });

  test("パスワード変更直後のログインでは iat が更新されセッションが維持される", async () => {
    const now = Math.floor(Date.now() / 1000);
    const passwordChangedAt = new Date((now - 1) * 1000);
    vi.mocked(mockRepo.findPasswordChangedAt).mockResolvedValue(
      passwordChangedAt,
    );

    const token = { sub: "user-1" } as JWT;
    const result = await jwtCallback({ token, user: { id: "user-1" } });

    expect(result.id).toBe("user-1");
    expect(result.iat).toBeGreaterThanOrEqual(now);
  });

  test("userId が無いトークンは空トークンを返す", async () => {
    const token = {} as JWT;
    const result = await jwtCallback({ token });

    expect(result.id).toBeUndefined();
    expect(mockRepo.findPasswordChangedAt).not.toHaveBeenCalled();
  });

  test("DB障害時はトークンをそのまま返す（フェイルオープン）", async () => {
    vi.mocked(mockRepo.findPasswordChangedAt).mockRejectedValue(
      new Error("Connection refused"),
    );

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const result = await jwtCallback({ token });

    expect(result.id).toBe("user-1");
  });
});

describe("session コールバック", () => {
  const mockRepo = createMockUserRepository();
  const options = createAuthOptions({
    userRepository: mockRepo,
    loginRateLimiter: createMockRateLimiter(),
  });
  const sessionCallback = options.callbacks!.session! as unknown as (params: {
    session: { user?: { id?: string } };
    token: JWT;
  }) => { user?: { id?: string } };

  test("token.id がある場合は session.user.id を設定する", () => {
    const session = { user: {} as { id?: string } };
    const token = { id: "user-1" } as JWT;

    const result = sessionCallback({ session, token });

    expect(result.user?.id).toBe("user-1");
  });

  test("token.id が無い場合は session.user.id を設定しない", () => {
    const session = { user: {} as { id?: string } };
    const token = {} as JWT;

    const result = sessionCallback({ session, token });

    expect(result.user?.id).toBeUndefined();
  });
});

describe("authorize コールバック（レート制限）", () => {
  const extractAuthorize = (
    mockRepo: UserRepository,
    mockRateLimiter: RateLimiter,
  ) => {
    credentialsMock.mockClear();
    createAuthOptions({
      userRepository: mockRepo,
      loginRateLimiter: mockRateLimiter,
    });
    return credentialsMock.mock.calls[0][0].authorize as (
      credentials: { email: string; password: string } | undefined,
    ) => Promise<{ id: string; email: string } | null>;
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("レート制限超過時は null を返しDBクエリしない", async () => {
    const mockRepo = createMockUserRepository();
    const mockRateLimiter = createMockRateLimiter({
      check: vi.fn().mockImplementation(() => {
        throw new TooManyRequestsError();
      }),
    });
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    const result = await authorize({
      email: "test@example.com",
      password: "password",
    });

    expect(result).toBeNull();
    expect(mockRateLimiter.check).toHaveBeenCalledWith("test@example.com");
    expect(mockRepo.findByEmail).not.toHaveBeenCalled();
  });

  test("ユーザーが見つからない場合は recordFailure を呼ぶ", async () => {
    const mockRepo = createMockUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
    });
    const mockRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    const result = await authorize({
      email: "test@example.com",
      password: "password",
    });

    expect(result).toBeNull();
    expect(mockRateLimiter.recordFailure).toHaveBeenCalledWith(
      "test@example.com",
    );
  });

  test("パスワード不一致時は recordFailure を呼ぶ", async () => {
    const mockRepo = createMockUserRepository({
      findByEmail: vi
        .fn()
        .mockResolvedValue({ id: "user-1", email: "test@example.com" }),
      findPasswordHashById: vi.fn().mockResolvedValue("hashed-password"),
    });
    verifyPasswordMock.mockReturnValue(false);
    const mockRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    const result = await authorize({
      email: "test@example.com",
      password: "wrong-password",
    });

    expect(result).toBeNull();
    expect(mockRateLimiter.recordFailure).toHaveBeenCalledWith(
      "test@example.com",
    );
  });

  test("認証成功時は reset を呼びユーザーを返す", async () => {
    const mockRepo = createMockUserRepository({
      findByEmail: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        image: null,
      }),
      findPasswordHashById: vi.fn().mockResolvedValue("hashed-password"),
    });
    verifyPasswordMock.mockReturnValue(true);
    const mockRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    const result = await authorize({
      email: "test@example.com",
      password: "correct-password",
    });

    expect(result).toEqual({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      image: undefined,
    });
    expect(mockRateLimiter.reset).toHaveBeenCalledWith("test@example.com");
    expect(mockRateLimiter.recordFailure).not.toHaveBeenCalled();
  });

  test("check() が TooManyRequestsError 以外をスローした場合はそのまま再スローする", async () => {
    const mockRepo = createMockUserRepository();
    const mockRateLimiter = createMockRateLimiter({
      check: vi.fn().mockImplementation(() => {
        throw new Error("unexpected failure");
      }),
    });
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    await expect(
      authorize({ email: "test@example.com", password: "password" }),
    ).rejects.toThrow("unexpected failure");
  });

  test("パスワードハッシュが無い場合は recordFailure を呼ぶ", async () => {
    const mockRepo = createMockUserRepository({
      findByEmail: vi
        .fn()
        .mockResolvedValue({ id: "user-1", email: "test@example.com" }),
      findPasswordHashById: vi.fn().mockResolvedValue(null),
    });
    const mockRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    const result = await authorize({
      email: "test@example.com",
      password: "password",
    });

    expect(result).toBeNull();
    expect(mockRateLimiter.recordFailure).toHaveBeenCalledWith(
      "test@example.com",
    );
  });
});
