import { createGetSession } from "@/server/application/auth/session";
import { createServiceContainer } from "@/server/infrastructure/service-container";
import type { ServiceContainer } from "@/server/infrastructure/service-container";
import { userId } from "@/server/domain/common/ids";
import { nextAuthSessionService } from "@/server/infrastructure/auth/nextauth-session-service";
import { prismaAuthzRepository } from "@/server/infrastructure/repository/authz/prisma-authz-repository";
import { prismaCircleMembershipRepository } from "@/server/infrastructure/repository/circle-membership/prisma-circle-membership-repository";
import { prismaCircleRepository } from "@/server/infrastructure/repository/circle/prisma-circle-repository";
import { prismaCircleSessionMembershipRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-membership-repository";
import { prismaCircleSessionRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-repository";
import { prismaMatchRepository } from "@/server/infrastructure/repository/match/prisma-match-repository";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";
import { prismaSignupRepository } from "@/server/infrastructure/repository/user/prisma-signup-repository";
import { prismaCircleInviteLinkRepository } from "@/server/infrastructure/repository/circle-invite-link/prisma-circle-invite-link-repository";
import { prismaUnitOfWork } from "@/server/infrastructure/transaction/prisma-unit-of-work";
import {
  hashPassword,
  verifyPassword,
} from "@/server/infrastructure/auth/password";
import { createJapaneseHolidayProvider } from "@/server/infrastructure/holiday/japanese-holiday-provider";
import { createInMemoryRateLimiter } from "@/server/infrastructure/rate-limit/in-memory-rate-limiter";

const getSession = createGetSession(nextAuthSessionService);
const japaneseHolidayProvider = createJapaneseHolidayProvider();

const buildServiceContainer = (): ServiceContainer =>
  createServiceContainer({
    circleRepository: prismaCircleRepository,
    circleMembershipRepository: prismaCircleMembershipRepository,
    circleSessionRepository: prismaCircleSessionRepository,
    matchRepository: prismaMatchRepository,
    circleSessionMembershipRepository:
      prismaCircleSessionMembershipRepository,
    userRepository: prismaUserRepository,
    authzRepository: prismaAuthzRepository,
    signupRepository: prismaSignupRepository,
    circleInviteLinkRepository: prismaCircleInviteLinkRepository,
    passwordUtils: { hash: hashPassword, verify: verifyPassword },
    changePasswordRateLimiter: createInMemoryRateLimiter({
      maxAttempts: 5,
      windowMs: 60_000,
    }),
    holidayProvider: japaneseHolidayProvider,
    unitOfWork: prismaUnitOfWork,
  });

export const createContext = async () => {
  const session = await getSession();
  const actorId = session?.user?.id ? userId(session.user.id) : null;
  const services = buildServiceContainer();

  return {
    actorId,
    ...services,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
