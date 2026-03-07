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
import { createRoundRobinScheduleService } from "@/server/application/round-robin-schedule/round-robin-schedule-service";
import { createNotificationService } from "@/server/application/notification/notification-service";
import type { RateLimiter } from "@/server/domain/common/rate-limiter";
import type { EmailSender } from "@/server/domain/common/email-sender";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { UnitOfWork } from "@/server/domain/common/unit-of-work";
import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { CircleInviteLinkRepository } from "@/server/domain/models/circle-invite-link/circle-invite-link-repository";
import type { PasswordHasher } from "@/server/domain/common/password-hasher";
import type { HolidayProvider } from "@/server/domain/common/holiday-provider";
import type { RoundRobinScheduleRepository } from "@/server/domain/models/round-robin-schedule/round-robin-schedule-repository";
import type { BackgroundTaskRunner } from "@/server/domain/common/background-task";

export type ServiceContainer = {
  circleService: ReturnType<typeof createCircleService>;
  circleMembershipService: ReturnType<typeof createCircleMembershipService>;
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
  roundRobinScheduleService: ReturnType<
    typeof createRoundRobinScheduleService
  >;
  holidayProvider: HolidayProvider;
};

export type ServiceContainerDeps = {
  circleRepository: CircleRepository;
  circleSessionRepository: CircleSessionRepository;
  matchRepository: MatchRepository;
  userRepository: UserRepository;
  authzRepository: AuthzRepository;
  circleInviteLinkRepository: CircleInviteLinkRepository;
  roundRobinScheduleRepository: RoundRobinScheduleRepository;
  passwordHasher: PasswordHasher;
  changePasswordRateLimiter: RateLimiter;
  holidayProvider: HolidayProvider;
  emailSender: EmailSender;
  runInBackground?: BackgroundTaskRunner;
  unitOfWork?: UnitOfWork;
};

export const createServiceContainer = (
  deps: ServiceContainerDeps,
): ServiceContainer => {
  const accessService = createAccessService({
    authzRepository: deps.authzRepository,
    userRepository: deps.userRepository,
  });
  const notificationService = createNotificationService({
    circleRepository: deps.circleRepository,
    userRepository: deps.userRepository,
    emailSender: deps.emailSender,
  });
  return {
    circleService: createCircleService({
      circleRepository: deps.circleRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleMembershipService: createCircleMembershipService({
      circleRepository: deps.circleRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    circleSessionService: createCircleSessionService({
      circleRepository: deps.circleRepository,
      circleSessionRepository: deps.circleSessionRepository,
      accessService,
      notificationService,
      runInBackground: deps.runInBackground,
      unitOfWork: deps.unitOfWork,
    }),
    circleSessionMembershipService: createCircleSessionMembershipService({
      circleRepository: deps.circleRepository,
      circleSessionRepository: deps.circleSessionRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    matchService: createMatchService({
      matchRepository: deps.matchRepository,
      circleSessionRepository: deps.circleSessionRepository,
      accessService,
      unitOfWork: deps.unitOfWork,
    }),
    accessService,
    userService: createUserService({
      userRepository: deps.userRepository,
      accessService,
      passwordHasher: deps.passwordHasher,
      changePasswordRateLimiter: deps.changePasswordRateLimiter,
    }),
    signupService: createSignupService({
      userRepository: deps.userRepository,
      passwordHasher: deps.passwordHasher,
    }),
    circleInviteLinkService: createCircleInviteLinkService({
      circleInviteLinkRepository: deps.circleInviteLinkRepository,
      circleRepository: deps.circleRepository,
      accessService,
    }),
    userStatisticsService: createUserStatisticsService({
      matchRepository: deps.matchRepository,
      userRepository: deps.userRepository,
    }),
    roundRobinScheduleService: createRoundRobinScheduleService({
      roundRobinScheduleRepository: deps.roundRobinScheduleRepository,
      circleSessionRepository: deps.circleSessionRepository,
      accessService,
    }),
    holidayProvider: deps.holidayProvider,
  };
};
