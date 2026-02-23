import { vi } from "vitest";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { MatchHistoryRepository } from "@/server/domain/models/match-history/match-history-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle/circle-invite-link-repository";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";

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

export const createMockMatchHistoryRepository = () =>
  ({
    listByMatchId: vi.fn(),
    add: vi.fn(),
  }) satisfies MatchHistoryRepository;

export const createMockCircleSessionParticipationRepository = () =>
  ({
    listParticipations: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    updateParticipationRole: vi.fn(),
    areUsersParticipating: vi.fn(),
    removeParticipation: vi.fn(),
  }) satisfies CircleSessionParticipationRepository;

export const createMockCircleSessionRepository = () =>
  ({
    findById: vi.fn(),
    findByIds: vi.fn(),
    listByCircleId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  }) satisfies CircleSessionRepository;

export const createMockCircleParticipationRepository = () =>
  ({
    listByCircleId: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    updateParticipationRole: vi.fn(),
    removeParticipation: vi.fn(),
  }) satisfies CircleParticipationRepository;

export const createMockCircleRepository = () =>
  ({
    findById: vi.fn(),
    findByIds: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
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
