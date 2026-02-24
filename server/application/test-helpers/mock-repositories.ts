import { vi } from "vitest";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionMembershipRepository } from "@/server/domain/models/circle-session/circle-session-membership-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleMembershipRepository } from "@/server/domain/models/circle/circle-membership-repository";
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

export const createMockCircleSessionMembershipRepository = () =>
  ({
    listMemberships: vi.fn(),
    listByUserId: vi.fn(),
    addMembership: vi.fn(),
    updateMembershipRole: vi.fn(),
    areUsersParticipating: vi.fn(),
    removeMembership: vi.fn(),
  }) satisfies CircleSessionMembershipRepository;

export const createMockCircleSessionRepository = () =>
  ({
    findById: vi.fn(),
    findByIds: vi.fn(),
    listByCircleId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  }) satisfies CircleSessionRepository;

export const createMockCircleMembershipRepository = () =>
  ({
    listByCircleId: vi.fn(),
    listByUserId: vi.fn(),
    addMembership: vi.fn(),
    updateMembershipRole: vi.fn(),
    removeMembership: vi.fn(),
  }) satisfies CircleMembershipRepository;

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
