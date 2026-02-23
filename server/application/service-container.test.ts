import { describe, expect, test, vi } from "vitest";
import { createServiceContainer } from "@/server/application/service-container";
import { matchHistoryId } from "@/server/domain/common/ids";
import {
  createMockCircleRepository,
  createMockCircleParticipationRepository,
  createMockCircleSessionRepository,
  createMockMatchRepository,
  createMockMatchHistoryRepository,
  createMockCircleSessionParticipationRepository,
  createMockUserRepository,
  createMockAuthzRepository,
  createMockCircleInviteLinkRepository,
} from "@/server/application/test-helpers/mock-repositories";

const createSignupStub = () => ({
  emailExists: vi.fn(),
  createUser: vi.fn(),
});

describe("Service container", () => {
  test("依存を注入してサービスを作成できる", async () => {
    const circleRepository = createMockCircleRepository();
    const circleParticipationRepository =
      createMockCircleParticipationRepository();
    const circleSessionRepository = createMockCircleSessionRepository();
    const matchRepository = createMockMatchRepository();
    const matchHistoryRepository = createMockMatchHistoryRepository();
    const circleSessionParticipationRepository =
      createMockCircleSessionParticipationRepository();
    const userRepository = createMockUserRepository();
    const authzRepository = createMockAuthzRepository();
    const signupRepository = createSignupStub();
    const circleInviteLinkRepository = createMockCircleInviteLinkRepository();

    const container = createServiceContainer({
      circleRepository,
      circleParticipationRepository,
      circleSessionRepository,
      matchRepository,
      matchHistoryRepository,
      circleSessionParticipationRepository,
      userRepository,
      authzRepository,
      signupRepository,
      circleInviteLinkRepository,
      passwordUtils: { hash: vi.fn(), verify: vi.fn() },
      holidayProvider: {
        getHolidayDateStrings: vi.fn(),
        getHolidayDateStringsForRange: vi.fn(),
      },
      generateMatchHistoryId: () => matchHistoryId("history-1"),
    });

    expect(container.circleService).toBeDefined();
    expect(container.circleParticipationService).toBeDefined();
    expect(container.circleSessionService).toBeDefined();
    expect(container.circleSessionParticipationService).toBeDefined();
    expect(container.accessService).toBeDefined();
    expect(container.userService).toBeDefined();
    expect(container.matchService).toBeDefined();
    expect(container.matchHistoryService).toBeDefined();
    expect(container.signupService).toBeDefined();
    expect(container.circleInviteLinkService).toBeDefined();
    expect(container.holidayProvider).toBeDefined();

    circleRepository.findById.mockResolvedValueOnce(null);
    await expect(
      container.circleService.getCircle("user-1", "circle-1" as never),
    ).resolves.toBeNull();
  });
});
