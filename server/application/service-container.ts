import { randomUUID } from "crypto";
import { createCircleService } from "@/server/application/circle/circle-service";
import { createCircleParticipationService } from "@/server/application/circle/circle-participation-service";
import { createCircleSessionService } from "@/server/application/circle-session/circle-session-service";
import { createCircleSessionParticipationService } from "@/server/application/circle-session/circle-session-participation-service";
import { createMatchService } from "@/server/application/match/match-service";
import { createMatchHistoryService } from "@/server/application/match-history/match-history-service";
import { createAccessService } from "@/server/application/authz/access-service";
import { createUserService } from "@/server/application/user/user-service";
import { createSignupService } from "@/server/application/auth/signup-service";
import { createCircleInviteLinkService } from "@/server/application/circle/circle-invite-link-service";
import { createInMemoryRateLimiter } from "@/server/infrastructure/rate-limit/in-memory-rate-limiter";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { MatchHistoryRepository } from "@/server/domain/models/match-history/match-history-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { UnitOfWork } from "@/server/application/common/unit-of-work";
import { matchHistoryId } from "@/server/domain/common/ids";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { SignupRepository } from "@/server/domain/models/user/signup-repository";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle/circle-invite-link-repository";
import type { PasswordUtils } from "@/server/application/user/user-service";

export type ServiceContainer = {
  circleService: ReturnType<typeof createCircleService>;
  circleParticipationService: ReturnType<
    typeof createCircleParticipationService
  >;
  circleSessionService: ReturnType<typeof createCircleSessionService>;
  circleSessionParticipationService: ReturnType<
    typeof createCircleSessionParticipationService
  >;
  accessService: ReturnType<typeof createAccessService>;
  userService: ReturnType<typeof createUserService>;
  matchService: ReturnType<typeof createMatchService>;
  matchHistoryService: ReturnType<typeof createMatchHistoryService>;
  signupService: ReturnType<typeof createSignupService>;
  circleInviteLinkService: ReturnType<typeof createCircleInviteLinkService>;
};

export type ServiceContainerDeps = {
  circleRepository: CircleRepository;
  circleParticipationRepository: CircleParticipationRepository;
  circleSessionRepository: CircleSessionRepository;
  matchRepository: MatchRepository;
  matchHistoryRepository: MatchHistoryRepository;
  circleSessionParticipationRepository: CircleSessionParticipationRepository;
  userRepository: UserRepository;
  authzRepository: AuthzRepository;
  signupRepository: SignupRepository;
  circleInviteLinkRepository: CircleInviteLinkRepository;
  passwordUtils: PasswordUtils;
  generateMatchHistoryId?: () => ReturnType<typeof matchHistoryId>;
  unitOfWork?: UnitOfWork;
};

export const createServiceContainer = (
  deps: ServiceContainerDeps,
): ServiceContainer => {
  const accessService = createAccessService(deps.authzRepository);
  const generateMatchHistoryId =
    deps.generateMatchHistoryId ?? (() => matchHistoryId(randomUUID()));

  return {
    circleService: createCircleService({
      circleRepository: deps.circleRepository,
      circleParticipationRepository: deps.circleParticipationRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleParticipationService: createCircleParticipationService({
      circleParticipationRepository: deps.circleParticipationRepository,
      circleSessionParticipationRepository:
        deps.circleSessionParticipationRepository,
      circleRepository: deps.circleRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleSessionService: createCircleSessionService({
      circleRepository: deps.circleRepository,
      circleSessionRepository: deps.circleSessionRepository,
      circleSessionParticipationRepository:
        deps.circleSessionParticipationRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleSessionParticipationService: createCircleSessionParticipationService({
      matchRepository: deps.matchRepository,
      circleRepository: deps.circleRepository,
      circleSessionRepository: deps.circleSessionRepository,
      circleSessionParticipationRepository:
        deps.circleSessionParticipationRepository,
      accessService,
    }),
    matchService: createMatchService({
      matchRepository: deps.matchRepository,
      matchHistoryRepository: deps.matchHistoryRepository,
      circleSessionParticipationRepository:
        deps.circleSessionParticipationRepository,
      circleSessionRepository: deps.circleSessionRepository,
      accessService,
      generateMatchHistoryId,
      unitOfWork: deps.unitOfWork,
    }),
    accessService,
    userService: createUserService({
      userRepository: deps.userRepository,
      accessService,
      passwordUtils: deps.passwordUtils,
      changePasswordRateLimiter: createInMemoryRateLimiter({
        maxAttempts: 5,
        windowMs: 60_000,
      }),
    }),
    matchHistoryService: createMatchHistoryService({
      matchHistoryRepository: deps.matchHistoryRepository,
      matchRepository: deps.matchRepository,
      circleSessionRepository: deps.circleSessionRepository,
      accessService,
    }),
    signupService: createSignupService({
      signupRepository: deps.signupRepository,
    }),
    circleInviteLinkService: createCircleInviteLinkService({
      circleInviteLinkRepository: deps.circleInviteLinkRepository,
      circleRepository: deps.circleRepository,
      circleParticipationRepository: deps.circleParticipationRepository,
      accessService,
    }),
  };
};
