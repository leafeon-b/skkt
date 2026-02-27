import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";

export type Repositories = {
  circleRepository: CircleRepository;
  circleSessionRepository: CircleSessionRepository;
  matchRepository: MatchRepository;
  userRepository: UserRepository;
  authzRepository: AuthzRepository;
};

export type UnitOfWork = <T>(
  operation: (repos: Repositories) => Promise<T>,
) => Promise<T>;
