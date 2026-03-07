import { beforeAll, describe, expect, test, vi } from "vitest";
import type { ServiceContainerDeps } from "@/server/infrastructure/service-container";

beforeAll(() => {
  process.env.UNSUBSCRIBE_SECRET = "test-secret-that-is-at-least-32-characters-long";
});

vi.mock("@/server/infrastructure/service-container", () => ({
  createServiceContainer: vi.fn(() => ({})),
}));

vi.mock("@/server/infrastructure/repository/circle/prisma-circle-repository", () => ({
  prismaCircleRepository: {},
}));

vi.mock("@/server/infrastructure/repository/circle-session/prisma-circle-session-repository", () => ({
  prismaCircleSessionRepository: {},
}));

vi.mock("@/server/infrastructure/repository/match/prisma-match-repository", () => ({
  prismaMatchRepository: {},
}));

vi.mock("@/server/infrastructure/repository/user/prisma-user-repository", () => ({
  prismaUserRepository: {},
}));

vi.mock("@/server/infrastructure/repository/authz/prisma-authz-repository", () => ({
  prismaAuthzRepository: {},
}));

vi.mock("@/server/infrastructure/repository/circle-invite-link/prisma-circle-invite-link-repository", () => ({
  prismaCircleInviteLinkRepository: {},
}));

vi.mock("@/server/infrastructure/repository/round-robin-schedule/prisma-round-robin-schedule-repository", () => ({
  prismaRoundRobinScheduleRepository: {},
}));

vi.mock("@/server/infrastructure/auth/password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@/server/infrastructure/auth/nextauth-session-service", () => ({
  nextAuthSessionService: {},
}));

vi.mock("@/server/infrastructure/transaction/prisma-unit-of-work", () => ({
  prismaUnitOfWork: vi.fn(),
}));

vi.mock("@/server/infrastructure/holiday/japanese-holiday-provider", () => ({
  createJapaneseHolidayProvider: vi.fn(() => ({
    getHolidayDateStrings: vi.fn(),
    getHolidayDateStringsForRange: vi.fn(),
  })),
}));

vi.mock("@/server/infrastructure/rate-limit/prisma-rate-limiter", () => ({
  createPrismaRateLimiter: vi.fn(() => ({
    check: vi.fn(),
    recordAttempt: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock("@/server/infrastructure/email/resend-email-sender", () => ({
  createResendEmailSender: vi.fn(() => ({ send: vi.fn() })),
}));

vi.mock("@/server/infrastructure/email/noop-email-sender", () => ({
  noopEmailSender: { send: vi.fn() },
}));

vi.mock("@/server/domain/services/unsubscribe-token", () => ({
  createUnsubscribeTokenService: vi.fn(() => ({
    generate: vi.fn(),
    verify: vi.fn(),
  })),
}));

vi.mock("@/server/infrastructure/repository/notification-preference/prisma-notification-preference-repository", () => ({
  prismaNotificationPreferenceRepository: {},
}));

describe("buildServiceContainer ワイヤリング", () => {
  test("buildServiceContainer() を複数回呼び出しても holidayProvider が同一インスタンスである", async () => {
    const { createServiceContainer } = await import(
      "@/server/infrastructure/service-container"
    );
    const { buildServiceContainer } = await import(
      "@/server/presentation/trpc/context"
    );

    const spy = vi.mocked(createServiceContainer);

    buildServiceContainer();
    buildServiceContainer();

    const deps1 = spy.mock.calls[0]?.[0] as ServiceContainerDeps;
    const deps2 = spy.mock.calls[1]?.[0] as ServiceContainerDeps;

    expect(deps1.holidayProvider).toBe(deps2.holidayProvider);
  });

  test("buildServiceContainer() を複数回呼び出しても changePasswordRateLimiter が同一インスタンスである", async () => {
    const { createServiceContainer } = await import(
      "@/server/infrastructure/service-container"
    );
    const { buildServiceContainer } = await import(
      "@/server/presentation/trpc/context"
    );

    const spy = vi.mocked(createServiceContainer);
    spy.mockClear();

    buildServiceContainer();
    buildServiceContainer();

    const deps1 = spy.mock.calls[0]?.[0] as ServiceContainerDeps;
    const deps2 = spy.mock.calls[1]?.[0] as ServiceContainerDeps;

    expect(deps1.changePasswordRateLimiter).toBe(
      deps2.changePasswordRateLimiter,
    );
  });
});
