import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleMembershipRepository } from "@/server/domain/models/circle/circle-membership-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleSessionMembershipRepository } from "@/server/domain/models/circle-session/circle-session-membership-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { MatchHistoryRepository } from "@/server/domain/models/match-history/match-history-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { SignupRepository } from "@/server/domain/models/user/signup-repository";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";

export type Repositories = {
  circleRepository: CircleRepository;
  circleMembershipRepository: CircleMembershipRepository;
  circleSessionRepository: CircleSessionRepository;
  circleSessionMembershipRepository: CircleSessionMembershipRepository;
  matchRepository: MatchRepository;
  matchHistoryRepository: MatchHistoryRepository;
  userRepository: UserRepository;
  signupRepository: SignupRepository;
  authzRepository: AuthzRepository;
};

export type UnitOfWork = <T>(
  operation: (repos: Repositories) => Promise<T>,
) => Promise<T>;
