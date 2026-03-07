import { afterEach, describe, expect, test, vi } from "vitest";
import type { AuthOptions } from "next-auth";

vi.mock("@/server/env", () => ({ env: {} }));

const getServerSessionMock = vi.hoisted(() => vi.fn());
const createAuthOptionsMock = vi.hoisted(() =>
  vi.fn().mockReturnValue({} as AuthOptions),
);

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));
vi.mock("./nextauth-handler", () => ({
  createAuthOptions: createAuthOptionsMock,
}));

import { nextAuthSessionService } from "./nextauth-session-service";

describe("nextAuthSessionService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("session.user.id が未設定の場合は null を返す", async () => {
    getServerSessionMock.mockResolvedValue({ user: {} });

    const result = await nextAuthSessionService.getSession();

    expect(result).toBeNull();
  });

  test("session が null の場合は null を返す", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const result = await nextAuthSessionService.getSession();

    expect(result).toBeNull();
  });

  test("session.user が undefined の場合は null を返す", async () => {
    getServerSessionMock.mockResolvedValue({});

    const result = await nextAuthSessionService.getSession();

    expect(result).toBeNull();
  });

  test("session.user.id がある場合はセッションを返す", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        image: null,
      },
    });

    const result = await nextAuthSessionService.getSession();

    expect(result).toEqual({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        image: null,
      },
    });
  });
});

describe("DB障害時のセッション無効化チェーン", () => {
  test("session.user.id 未設定 → createGetSessionUserId が UnauthorizedError をスローする", async () => {
    getServerSessionMock.mockResolvedValue({ user: {} });

    const { createGetSessionUserId } =
      await import("@/server/application/auth/session");
    const getSessionUserId = createGetSessionUserId(nextAuthSessionService);

    await expect(getSessionUserId()).rejects.toThrow("Unauthorized");
  });
});
