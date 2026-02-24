import { createCircleService } from "@/server/application/circle/circle-service";
import { createCircleMembershipService } from "@/server/application/circle/circle-membership-service";
import { createCircleSessionService } from "@/server/application/circle-session/circle-session-service";
import { createCircleSessionMembershipService } from "@/server/application/circle-session/circle-session-membership-service";
import { createMatchService } from "@/server/application/match/match-service";
import { createAccessService } from "@/server/application/authz/access-service";
import { createUserService } from "@/server/application/user/user-service";
import { createSignupService } from "@/server/application/auth/signup-service";
import { createCircleInviteLinkService } from "@/server/application/circle/circle-invite-link-service";
import { createUserStatisticsService } from "@/server/application/user/user-statistics-service";
import type { RateLimiter } from "@/server/application/common/rate-limiter";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleMembershipRepository } from "@/server/domain/models/circle/circle-membership-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionMembershipRepository } from "@/server/domain/models/circle-session/circle-session-membership-repository";
import type { UnitOfWork } from "@/server/application/common/unit-of-work";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { SignupRepository } from "@/server/domain/models/user/signup-repository";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle-invite-link/circle-invite-link-repository";
import type { PasswordUtils } from "@/server/application/user/user-service";
import type { HolidayProvider } from "@/server/application/common/holiday-provider";

export type ServiceContainer = {
  circleService: ReturnType<typeof createCircleService>;
  circleMembershipService: ReturnType<
    typeof createCircleMembershipService
  >;
  circleSessionService: ReturnType<typeof createCircleSessionService>;
  circleSessionMembershipService: ReturnType<
    typeof createCircleSessionMembershipService
  >;
  accessService: ReturnType<typeof createAccessService>;
  userService: ReturnType<typeof createUserService>;
  matchService: ReturnType<typeof createMatchService>;
  signupService: ReturnType<typeof createSignupService>;
  circleInviteLinkService: ReturnType<typeof createCircleInviteLinkService>;
  userStatisticsService: ReturnType<typeof createUserStatisticsService>;
  holidayProvider: HolidayProvider;
};

export type ServiceContainerDeps = {
  circleRepository: CircleRepository;
  circleMembershipRepository: CircleMembershipRepository;
  circleSessionRepository: CircleSessionRepository;
  matchRepository: MatchRepository;
  circleSessionMembershipRepository: CircleSessionMembershipRepository;
  userRepository: UserRepository;
  authzRepository: AuthzRepository;
  signupRepository: SignupRepository;
  circleInviteLinkRepository: CircleInviteLinkRepository;
  passwordUtils: PasswordUtils;
  changePasswordRateLimiter: RateLimiter;
  holidayProvider: HolidayProvider;
  unitOfWork?: UnitOfWork;
};

export const createServiceContainer = (
  deps: ServiceContainerDeps,
): ServiceContainer => {
  const accessService = createAccessService({
    authzRepository: deps.authzRepository,
    userRepository: deps.userRepository,
  });
  return {
    circleService: createCircleService({
      circleRepository: deps.circleRepository,
      circleMembershipRepository: deps.circleMembershipRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleMembershipService: createCircleMembershipService({
      circleMembershipRepository: deps.circleMembershipRepository,
      circleRepository: deps.circleRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleSessionService: createCircleSessionService({
      circleRepository: deps.circleRepository,
      circleSessionRepository: deps.circleSessionRepository,
      circleSessionMembershipRepository:
        deps.circleSessionMembershipRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleSessionMembershipService: createCircleSessionMembershipService({
      circleRepository: deps.circleRepository,
      circleSessionRepository: deps.circleSessionRepository,
      circleSessionMembershipRepository:
        deps.circleSessionMembershipRepository,
      accessService,
    }),
    matchService: createMatchService({
      matchRepository: deps.matchRepository,
      circleSessionMembershipRepository:
        deps.circleSessionMembershipRepository,
      circleSessionRepository: deps.circleSessionRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    accessService,
    userService: createUserService({
      userRepository: deps.userRepository,
      accessService,
      passwordUtils: deps.passwordUtils,
      changePasswordRateLimiter: deps.changePasswordRateLimiter,
    }),
    signupService: createSignupService({
      signupRepository: deps.signupRepository,
    }),
    circleInviteLinkService: createCircleInviteLinkService({
      circleInviteLinkRepository: deps.circleInviteLinkRepository,
      circleRepository: deps.circleRepository,
      circleMembershipRepository: deps.circleMembershipRepository,
      accessService,
    }),
    userStatisticsService: createUserStatisticsService({
      matchRepository: deps.matchRepository,
      userRepository: deps.userRepository,
    }),
    holidayProvider: deps.holidayProvider,
  };
};
