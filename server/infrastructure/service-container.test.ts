import { describe, expect, test, vi } from "vitest";

vi.mock("@/server/env", () => ({ env: {} }));

import { createServiceContainer } from "@/server/infrastructure/service-container";
import {
  createMockCircleRepository,
  createMockCircleSessionRepository,
  createMockMatchRepository,
  createMockUserRepository,
  createMockAuthzRepository,
  createMockCircleInviteLinkRepository,
  createMockRoundRobinScheduleRepository,
  createMockNotificationPreferenceRepository,
} from "@/server/application/test-helpers/mock-repositories";

describe("Service container", () => {
  test("依存を注入してサービスを作成できる", async () => {
    const circleRepository = createMockCircleRepository();
    const circleSessionRepository = createMockCircleSessionRepository();
    const matchRepository = createMockMatchRepository();
    const userRepository = createMockUserRepository();
    const authzRepository = createMockAuthzRepository();
    const circleInviteLinkRepository = createMockCircleInviteLinkRepository();
    const roundRobinScheduleRepository =
      createMockRoundRobinScheduleRepository();
    const notificationPreferenceRepository =
      createMockNotificationPreferenceRepository();

    const container = createServiceContainer({
      circleRepository,
      circleSessionRepository,
      matchRepository,
      userRepository,
      authzRepository,
      circleInviteLinkRepository,
      roundRobinScheduleRepository,
      notificationPreferenceRepository,
      unsubscribeTokenService: {
        generate: vi.fn(),
        verify: vi.fn(),
      },
      passwordHasher: { hash: vi.fn(), verify: vi.fn() },
      emailSender: { send: vi.fn() },
      changePasswordRateLimiter: {
        check: vi.fn(),
        recordAttempt: vi.fn(),
        reset: vi.fn(),
      },
      holidayProvider: {
        getHolidayDateStrings: vi.fn(),
        getHolidayDateStringsForRange: vi.fn(),
      },
    });

    expect(container.circleService).toBeDefined();
    expect(container.circleMembershipService).toBeDefined();
    expect(container.circleSessionService).toBeDefined();
    expect(container.circleSessionMembershipService).toBeDefined();
    expect(container.accessService).toBeDefined();
    expect(container.userService).toBeDefined();
    expect(container.matchService).toBeDefined();
    expect(container.signupService).toBeDefined();
    expect(container.circleInviteLinkService).toBeDefined();
    expect(container.holidayProvider).toBeDefined();

    circleRepository.findById.mockResolvedValueOnce(null);
    await expect(
      container.circleService.getCircle("user-1", "circle-1" as never),
    ).resolves.toBeNull();
  });
});
