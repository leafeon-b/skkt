import { vi } from "vitest";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle-invite-link/circle-invite-link-repository";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type {
  Repositories,
  UnitOfWork,
} from "@/server/application/common/unit-of-work";

export const createMockMatchRepository = () =>
  ({
    findById: vi.fn(),
    listByCircleSessionId: vi.fn(),
    listByPlayerId: vi.fn(),
    listByBothPlayerIds: vi.fn(),
    listByPlayerIdWithCircle: vi.fn(),
    listDistinctOpponentIds: vi.fn(),
    save: vi.fn(),
  }) satisfies MatchRepository;

export const createMockCircleSessionRepository = () =>
  ({
    findById: vi.fn(),
    findByIds: vi.fn(),
    listByCircleId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    listMemberships: vi.fn(),
    listMembershipsByUserId: vi.fn(),
    addMembership: vi.fn(),
    updateMembershipRole: vi.fn(),
    areUsersParticipating: vi.fn(),
    removeMembership: vi.fn(),
  }) satisfies CircleSessionRepository;

export const createMockCircleRepository = () =>
  ({
    findById: vi.fn(),
    findByIds: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    listMembershipsByCircleId: vi.fn(),
    listMembershipsByUserId: vi.fn(),
    addMembership: vi.fn(),
    updateMembershipRole: vi.fn(),
    removeMembership: vi.fn(),
  }) satisfies CircleRepository;

export const createMockUserRepository = () =>
  ({
    findById: vi.fn(),
    findByIds: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    updateProfile: vi.fn(),
    emailExists: vi.fn(),
    findPasswordHashById: vi.fn(),
    findPasswordChangedAt: vi.fn(),
    updatePasswordHash: vi.fn(),
    updateProfileVisibility: vi.fn(),
    createUser: vi.fn(),
  }) satisfies UserRepository;

export const createMockCircleInviteLinkRepository = () =>
  ({
    findByToken: vi.fn(),
    findActiveByCircleId: vi.fn(),
    save: vi.fn(),
  }) satisfies CircleInviteLinkRepository;

export const createMockAuthzRepository = () =>
  ({
    isRegisteredUser: vi.fn(),
    findCircleMembership: vi.fn(),
    findCircleSessionMembership: vi.fn(),
  }) satisfies AuthzRepository;

export const createMockUnitOfWork = (
  overrides?: Partial<Repositories>,
): { unitOfWork: UnitOfWork; repos: Repositories } => {
  const repos: Repositories = {
    circleRepository: createMockCircleRepository(),
    circleSessionRepository: createMockCircleSessionRepository(),
    matchRepository: createMockMatchRepository(),
    userRepository: createMockUserRepository(),
    authzRepository: createMockAuthzRepository(),
    ...overrides,
  };

  const unitOfWork: UnitOfWork = vi.fn(async (op) => op(repos));

  return { unitOfWork, repos };
};
