import { describe, expect, test, vi } from "vitest";
import { createServiceContainer } from "@/server/application/service-container";
import { matchHistoryId } from "@/server/domain/common/ids";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle/circle-invite-link-repository";

const createStub = () => ({
  findById: vi.fn(),
  findByIds: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
});

const createParticipationStub = () => ({
  listByCircleId: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  removeParticipation: vi.fn(),
});

const createSessionStub = () => ({
  findById: vi.fn(),
  findByIds: vi.fn(),
  listByCircleId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
});

const createMatchStub = () => ({
  findById: vi.fn(),
  listByCircleSessionId: vi.fn(),
  listByUserId: vi.fn(),
  listByUserIdWithCircleSession: vi.fn(),
  save: vi.fn(),
});

const createMatchHistoryStub = () => ({
  listByMatchId: vi.fn(),
  add: vi.fn(),
});

const createSessionParticipationStub = () => ({
  listParticipations: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  areUsersParticipating: vi.fn(),
  removeParticipation: vi.fn(),
});

const createAuthzStub = () => ({
  isRegisteredUser: vi.fn(),
  findCircleMembership: vi.fn(),
  findCircleSessionMembership: vi.fn(),
});

const createUserStub = () => ({
  findById: vi.fn(),
  findByIds: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  updateProfile: vi.fn(),
  emailExists: vi.fn(),
  findPasswordHashById: vi.fn(),
  findPasswordChangedAt: vi.fn(),
  updatePasswordHash: vi.fn(),
});

const createSignupStub = () => ({
  emailExists: vi.fn(),
  createUser: vi.fn(),
});

describe("Service container", () => {
  test("依存を注入してサービスを作成できる", async () => {
    const circleRepository = createStub();
    const circleParticipationRepository = createParticipationStub();
    const circleSessionRepository = createSessionStub();
    const matchRepository = createMatchStub();
    const matchHistoryRepository = createMatchHistoryStub();
    const circleSessionParticipationRepository =
      createSessionParticipationStub();
    const userRepository = createUserStub();
    const authzRepository = createAuthzStub();
    const signupRepository = createSignupStub();

    const circleInviteLinkRepository = {
      findByToken: vi.fn(),
      findActiveByCircleId: vi.fn(),
      save: vi.fn(),
    } satisfies CircleInviteLinkRepository;

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
