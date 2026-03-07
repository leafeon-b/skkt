import { vi } from "vitest";
import type { ServiceContainerDeps } from "@/server/infrastructure/service-container";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle-invite-link/circle-invite-link-repository";
import type { RoundRobinScheduleRepository } from "@/server/domain/models/round-robin-schedule/round-robin-schedule-repository";
import type { PasswordHasher } from "@/server/domain/common/password-hasher";
import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import type { HolidayProvider } from "@/server/domain/common/holiday-provider";
import type { EmailSender } from "@/server/domain/common/email-sender";
import type { BackgroundTaskRunner } from "@/server/domain/common/background-task";
import type { UserId } from "@/server/domain/common/ids";
import type { Mock } from "vitest";

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? Mock<(...args: A) => R>
    : T[K];
};

export type MockDeps = {
  circleRepository: Mocked<CircleRepository>;
  circleSessionRepository: Mocked<CircleSessionRepository>;
  matchRepository: Mocked<MatchRepository>;
  userRepository: Mocked<UserRepository>;
  authzRepository: Mocked<AuthzRepository>;
  circleInviteLinkRepository: Mocked<CircleInviteLinkRepository>;
  roundRobinScheduleRepository: Mocked<RoundRobinScheduleRepository>;
  passwordHasher: Mocked<PasswordHasher>;
  changePasswordRateLimiter: Mocked<RateLimiter>;
  holidayProvider: Mocked<HolidayProvider>;
  emailSender: Mocked<EmailSender>;
  waitUntil: BackgroundTaskRunner;
};

export const createMockDeps = (): MockDeps => ({
  circleRepository: {
    findById: vi.fn().mockResolvedValue(null),
    findByIds: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findMembershipByCircleAndUser: vi.fn().mockResolvedValue(null),
    listMembershipsByCircleId: vi.fn().mockResolvedValue([]),
    listMembershipsByUserId: vi.fn().mockResolvedValue([]),
    addMembership: vi.fn().mockResolvedValue(undefined),
    updateMembershipRole: vi.fn().mockResolvedValue(undefined),
    removeMembership: vi.fn().mockResolvedValue(undefined),
  },
  circleSessionRepository: {
    findById: vi.fn().mockResolvedValue(null),
    findByIds: vi.fn().mockResolvedValue([]),
    listByCircleId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    listMemberships: vi.fn().mockResolvedValue([]),
    listMembershipsByUserId: vi.fn().mockResolvedValue([]),
    addMembership: vi.fn().mockResolvedValue(undefined),
    updateMembershipRole: vi.fn().mockResolvedValue(undefined),
    areUsersSessionMembers: vi.fn().mockResolvedValue(false),
    removeMembership: vi.fn().mockResolvedValue(undefined),
    listDeletedMemberships: vi.fn().mockResolvedValue([]),
  },
  matchRepository: {
    findById: vi.fn().mockResolvedValue(null),
    listByCircleSessionId: vi.fn().mockResolvedValue([]),
    listByPlayerId: vi.fn().mockResolvedValue([]),
    listByBothPlayerIds: vi.fn().mockResolvedValue([]),
    listByPlayerIdWithCircle: vi.fn().mockResolvedValue([]),
    listDistinctOpponentIds: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  },
  userRepository: {
    findById: vi.fn().mockResolvedValue(null),
    findByIds: vi.fn().mockResolvedValue([]),
    findByEmail: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    emailExists: vi.fn().mockResolvedValue(false),
    findPasswordHashById: vi.fn().mockResolvedValue(null),
    findPasswordChangedAt: vi.fn().mockResolvedValue(null),
    updatePasswordHash: vi.fn().mockResolvedValue(undefined),
    updateProfileVisibility: vi.fn().mockResolvedValue(undefined),
    createUser: vi.fn().mockResolvedValue("new-user-id" as UserId),
  },
  authzRepository: {
    isRegisteredUser: vi.fn().mockResolvedValue(false),
    findCircleMembership: vi.fn().mockResolvedValue({ kind: "none" }),
    findCircleSessionMembership: vi.fn().mockResolvedValue({ kind: "none" }),
  },
  circleInviteLinkRepository: {
    findByToken: vi.fn().mockResolvedValue(null),
    findActiveByCircleId: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  },
  roundRobinScheduleRepository: {
    findByCircleSessionId: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    deleteByCircleSessionId: vi.fn().mockResolvedValue(undefined),
  },
  passwordHasher: {
    hash: vi.fn().mockReturnValue("hashed"),
    verify: vi.fn().mockReturnValue(false),
  },
  changePasswordRateLimiter: {
    check: vi.fn().mockResolvedValue(undefined),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
  },
  holidayProvider: {
    getHolidayDateStrings: vi.fn().mockReturnValue([]),
    getHolidayDateStringsForRange: vi.fn().mockReturnValue([]),
  },
  emailSender: {
    send: vi.fn().mockResolvedValue(undefined),
  },
  waitUntil: (p) => { void p; },
});

export const toServiceContainerDeps = (
  mockDeps: MockDeps,
): ServiceContainerDeps => mockDeps as unknown as ServiceContainerDeps;

export { createServiceContainer } from "@/server/infrastructure/service-container";
