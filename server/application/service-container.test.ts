import { describe, expect, test, vi } from "vitest";
import { createServiceContainer } from "@/server/application/service-container";
import { matchHistoryId } from "@/server/domain/common/ids";
import {
  createMockCircleRepository,
  createMockCircleMembershipRepository,
  createMockCircleSessionRepository,
  createMockMatchRepository,
  createMockMatchHistoryRepository,
  createMockCircleSessionMembershipRepository,
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
    const circleMembershipRepository =
      createMockCircleMembershipRepository();
    const circleSessionRepository = createMockCircleSessionRepository();
    const matchRepository = createMockMatchRepository();
    const matchHistoryRepository = createMockMatchHistoryRepository();
    const circleSessionMembershipRepository =
      createMockCircleSessionMembershipRepository();
    const userRepository = createMockUserRepository();
    const authzRepository = createMockAuthzRepository();
    const signupRepository = createSignupStub();
    const circleInviteLinkRepository = createMockCircleInviteLinkRepository();

    const container = createServiceContainer({
      circleRepository,
      circleMembershipRepository,
      circleSessionRepository,
      matchRepository,
      matchHistoryRepository,
      circleSessionMembershipRepository,
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
    expect(container.circleMembershipService).toBeDefined();
    expect(container.circleSessionService).toBeDefined();
    expect(container.circleSessionMembershipService).toBeDefined();
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
