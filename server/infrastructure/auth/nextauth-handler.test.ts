import { afterEach, describe, expect, test, vi } from "vitest";
import type { JWT } from "next-auth/jwt";
import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import { TooManyRequestsError } from "@/server/domain/common/errors";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import { USER_NAME_MAX_LENGTH } from "@/server/domain/models/user/user";

const prismaValue = vi.hoisted(() => ({
  prisma: {},
}));
const nextAuthMock = vi.hoisted(() => vi.fn());
const prismaAdapterMock = vi.hoisted(() => vi.fn());
const credentialsMock = vi.hoisted(() => vi.fn());
const googleMock = vi.hoisted(() => vi.fn());
const verifyPasswordMock = vi.hoisted(() => vi.fn());
const mockEnv = vi.hoisted(() => ({
  GOOGLE_CLIENT_ID: "default-client-id",
  GOOGLE_CLIENT_SECRET: "default-client-secret",
}));

vi.mock("@/server/env", () => ({ env: mockEnv }));
vi.mock("@/server/infrastructure/db", () => prismaValue);
vi.mock("next-auth", () => ({ default: nextAuthMock }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: prismaAdapterMock }));
vi.mock("next-auth/providers/credentials", () => ({
  default: credentialsMock,
}));
vi.mock("next-auth/providers/google", () => ({ default: googleMock }));
vi.mock("@/server/infrastructure/auth/password", () => ({
  DUMMY_HASH: "scrypt$dummysalt$dummykey",
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
  updateProfileVisibility: vi.fn(),
  emailExists: vi.fn(),
  findPasswordHashById: vi.fn(),
  findPasswordChangedAt: vi.fn(),
  updatePasswordHash: vi.fn(),
  createUser: vi.fn(),
  saveImageData: vi.fn().mockResolvedValue(undefined),
  findImageData: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const createMockRateLimiter = (
  overrides: Partial<RateLimiter> = {},
): RateLimiter => ({
  check: vi.fn(),
  recordAttempt: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

const mockGetClientIp = vi.fn(() => "1.2.3.4");

describe("NextAuth ハンドラ", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("PrismaAdapter と Google プロバイダを使って設定を生成する", () => {
    mockEnv.GOOGLE_CLIENT_ID = "client-id";
    mockEnv.GOOGLE_CLIENT_SECRET = "client-secret";

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
      loginIpRateLimiter: createMockRateLimiter(),
      getClientIp: mockGetClientIp,
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
      profile: expect.any(Function),
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

describe("Google プロバイダの profile コールバック", () => {
  const extractGoogleProfile = () => {
    googleMock.mockClear();
    mockEnv.GOOGLE_CLIENT_ID = "client-id";
    mockEnv.GOOGLE_CLIENT_SECRET = "client-secret";
    createAuthOptions({
      userRepository: createMockUserRepository(),
      loginRateLimiter: createMockRateLimiter(),
      loginIpRateLimiter: createMockRateLimiter(),
      getClientIp: mockGetClientIp,
    });
    return googleMock.mock.calls[0][0].profile as (profile: {
      sub: string;
      name: string;
      email: string;
      picture: string;
    }) => { id: string; name: string | null; email: string; image: string };
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("name が undefined の場合は null を返す", () => {
    const profile = extractGoogleProfile();

    const result = profile({
      sub: "google-undef",
      name: undefined as unknown as string,
      email: "user@example.com",
      picture: "https://example.com/photo.jpg",
    });

    expect(result.name).toBeNull();
  });

  test("name が空文字列の場合はそのまま返す", () => {
    const profile = extractGoogleProfile();

    const result = profile({
      sub: "google-empty",
      name: "",
      email: "user@example.com",
      picture: "https://example.com/photo.jpg",
    });

    expect(result.name).toBe("");
  });

  test("50文字以内の name はそのまま返す", () => {
    const profile = extractGoogleProfile();
    const name = "a".repeat(USER_NAME_MAX_LENGTH);

    const result = profile({
      sub: "google-123",
      name,
      email: "user@example.com",
      picture: "https://example.com/photo.jpg",
    });

    expect(result).toEqual({
      id: "google-123",
      name,
      email: "user@example.com",
      image: "https://example.com/photo.jpg",
    });
  });

  test("50文字超の name は50文字に切り詰める", () => {
    const profile = extractGoogleProfile();
    const longName = "a".repeat(USER_NAME_MAX_LENGTH + 10);

    const result = profile({
      sub: "google-456",
      name: longName,
      email: "user@example.com",
      picture: "https://example.com/photo.jpg",
    });

    expect(result.name).toBe("a".repeat(USER_NAME_MAX_LENGTH));
    expect(result.name!.length).toBe(USER_NAME_MAX_LENGTH);
  });

  test("サロゲートペアを含む50文字超の name を切り詰めてもサロゲートペアが分割されない", () => {
    const profile = extractGoogleProfile();
    // 49文字のASCII + 2文字の絵文字（各サロゲートペア）= 51コードポイント
    const nameWithEmoji = "a".repeat(49) + "🍣🍺";

    const result = profile({
      sub: "google-sp",
      name: nameWithEmoji,
      email: "user@example.com",
      picture: "https://example.com/photo.jpg",
    });

    expect(result.name).toBe("a".repeat(49) + "🍣");
    expect(result.name!.length).toBe(USER_NAME_MAX_LENGTH + 1); // サロゲートペアは length 2
    expect([...result.name!].length).toBe(USER_NAME_MAX_LENGTH); // コードポイント数は50
  });

  test("必須フィールド（id, email, name, image）をすべて返す", () => {
    const profile = extractGoogleProfile();

    const result = profile({
      sub: "google-789",
      name: "Test User",
      email: "test@example.com",
      picture: "https://example.com/pic.jpg",
    });

    expect(result).toEqual({
      id: "google-789",
      name: "Test User",
      email: "test@example.com",
      image: "https://example.com/pic.jpg",
    });
  });
});

describe("JWT コールバック", () => {
  const mockRepo = createMockUserRepository();
  const options = createAuthOptions({
    userRepository: mockRepo,
    loginRateLimiter: createMockRateLimiter(),
    loginIpRateLimiter: createMockRateLimiter(),
    getClientIp: mockGetClientIp,
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

  test("DB障害時は空トークンを返す（フェイルクローズド）", async () => {
    vi.mocked(mockRepo.findPasswordChangedAt).mockRejectedValue(
      new Error("Connection refused"),
    );

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const result = await jwtCallback({ token });

    expect(result.id).toBeUndefined();
  });
});

describe("session コールバック", () => {
  const mockRepo = createMockUserRepository();
  const options = createAuthOptions({
    userRepository: mockRepo,
    loginRateLimiter: createMockRateLimiter(),
    loginIpRateLimiter: createMockRateLimiter(),
    getClientIp: mockGetClientIp,
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
    mockIpRateLimiter?: RateLimiter,
  ) => {
    credentialsMock.mockClear();
    createAuthOptions({
      userRepository: mockRepo,
      loginRateLimiter: mockRateLimiter,
      loginIpRateLimiter: mockIpRateLimiter ?? createMockRateLimiter(),
      getClientIp: mockGetClientIp,
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
        throw new TooManyRequestsError(50_000);
      }),
    });
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    const result = await authorize({
      email: "test@example.com",
      password: "password",
    });

    expect(result).toBeNull();
    expect(mockRateLimiter.check).toHaveBeenCalledWith("test@example.com:1.2.3.4");
    expect(mockRepo.findByEmail).not.toHaveBeenCalled();
  });

  test("ユーザーが見つからない場合は recordAttempt を呼ぶ", async () => {
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
    expect(mockRateLimiter.recordAttempt).toHaveBeenCalledWith(
      "test@example.com:1.2.3.4",
    );
  });

  test("パスワード不一致時は recordAttempt を呼ぶ", async () => {
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
    expect(mockRateLimiter.recordAttempt).toHaveBeenCalledWith(
      "test@example.com:1.2.3.4",
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
    expect(mockRateLimiter.reset).toHaveBeenCalledWith("test@example.com:1.2.3.4");
    expect(mockRateLimiter.recordAttempt).not.toHaveBeenCalled();
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

  test("パスワードハッシュが無い場合は recordAttempt を呼ぶ", async () => {
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
    expect(mockRateLimiter.recordAttempt).toHaveBeenCalledWith(
      "test@example.com:1.2.3.4",
    );
  });

  test("IPのみのレート制限超過時は null を返しDBクエリしない", async () => {
    const mockRepo = createMockUserRepository();
    const mockRateLimiter = createMockRateLimiter();
    const mockIpRateLimiter = createMockRateLimiter({
      check: vi.fn().mockImplementation(() => {
        throw new TooManyRequestsError(30_000);
      }),
    });
    const authorize = extractAuthorize(mockRepo, mockRateLimiter, mockIpRateLimiter);

    const result = await authorize({
      email: "test@example.com",
      password: "password",
    });

    expect(result).toBeNull();
    expect(mockIpRateLimiter.check).toHaveBeenCalledWith("1.2.3.4");
    expect(mockRateLimiter.check).not.toHaveBeenCalled();
    expect(mockRepo.findByEmail).not.toHaveBeenCalled();
  });

  test("認証失敗時はIPのみのレート制限にも recordAttempt を呼ぶ", async () => {
    const mockRepo = createMockUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
    });
    const mockRateLimiter = createMockRateLimiter();
    const mockIpRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter, mockIpRateLimiter);

    await authorize({
      email: "test@example.com",
      password: "password",
    });

    expect(mockIpRateLimiter.recordAttempt).toHaveBeenCalledWith("1.2.3.4");
    expect(mockRateLimiter.recordAttempt).toHaveBeenCalledWith("test@example.com:1.2.3.4");
  });

  test("認証成功時はIPのみのレート制限にも reset を呼ぶ", async () => {
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
    const mockIpRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter, mockIpRateLimiter);

    await authorize({
      email: "test@example.com",
      password: "correct-password",
    });

    expect(mockIpRateLimiter.reset).toHaveBeenCalledWith("1.2.3.4");
    expect(mockRateLimiter.reset).toHaveBeenCalledWith("test@example.com:1.2.3.4");
  });
});

describe("authorize コールバック（タイミングサイドチャネル防止）", () => {
  const extractAuthorize = (
    mockRepo: UserRepository,
    mockRateLimiter: RateLimiter,
  ) => {
    credentialsMock.mockClear();
    createAuthOptions({
      userRepository: mockRepo,
      loginRateLimiter: mockRateLimiter,
      loginIpRateLimiter: createMockRateLimiter(),
      getClientIp: mockGetClientIp,
    });
    return credentialsMock.mock.calls[0][0].authorize as (
      credentials: { email: string; password: string } | undefined,
    ) => Promise<{ id: string; email: string } | null>;
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("ユーザー不存在時にダミーハッシュで verifyPassword を実行する", async () => {
    const mockRepo = createMockUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
    });
    const mockRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    await authorize({ email: "unknown@example.com", password: "password" });

    expect(verifyPasswordMock).toHaveBeenCalledWith(
      "password",
      "scrypt$dummysalt$dummykey",
    );
  });

  test("パスワードハッシュ不存在時にダミーハッシュで verifyPassword を実行する", async () => {
    const mockRepo = createMockUserRepository({
      findByEmail: vi
        .fn()
        .mockResolvedValue({ id: "user-1", email: "test@example.com" }),
      findPasswordHashById: vi.fn().mockResolvedValue(null),
    });
    const mockRateLimiter = createMockRateLimiter();
    const authorize = extractAuthorize(mockRepo, mockRateLimiter);

    await authorize({ email: "test@example.com", password: "password" });

    expect(verifyPasswordMock).toHaveBeenCalledWith(
      "password",
      "scrypt$dummysalt$dummykey",
    );
  });
});

describe("コールバックチェーン統合", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const setupCallbacks = (repoOverrides: Partial<UserRepository> = {}) => {
    const mockRepo = createMockUserRepository(repoOverrides);
    const options = createAuthOptions({
      userRepository: mockRepo,
      loginRateLimiter: createMockRateLimiter(),
      loginIpRateLimiter: createMockRateLimiter(),
      getClientIp: mockGetClientIp,
    });
    const jwtCallback = options.callbacks!.jwt! as (params: {
      token: JWT;
      user?: { id: string };
    }) => Promise<JWT>;
    const sessionCallback = options.callbacks!.session! as unknown as (params: {
      session: { user?: { id?: string } };
      token: JWT;
    }) => { user?: { id?: string } };
    return { jwtCallback, sessionCallback, mockRepo };
  };

  test("DB障害 → JWT空トークン → session で user.id 未設定", async () => {
    const { jwtCallback, sessionCallback } = setupCallbacks({
      findPasswordChangedAt: vi
        .fn()
        .mockRejectedValue(new Error("Connection refused")),
    });

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const jwtResult = await jwtCallback({ token });

    expect(jwtResult.id).toBeUndefined();

    const session = { user: {} as { id?: string } };
    const sessionResult = sessionCallback({ session, token: jwtResult });

    expect(sessionResult.user?.id).toBeUndefined();
  });

  test("パスワード変更検出 → JWT空トークン → session で user.id 未設定", async () => {
    const { jwtCallback, sessionCallback } = setupCallbacks({
      findPasswordChangedAt: vi
        .fn()
        .mockResolvedValue(new Date(1700001000 * 1000)),
    });

    const token = { id: "user-1", iat: 1700000000 } as JWT;
    const jwtResult = await jwtCallback({ token });

    expect(jwtResult.id).toBeUndefined();

    const session = { user: {} as { id?: string } };
    const sessionResult = sessionCallback({ session, token: jwtResult });

    expect(sessionResult.user?.id).toBeUndefined();
  });
});
