import { createGetSession } from "@/server/application/auth/session";
import { createServiceContainer } from "@/server/application/service-container";
import type { ServiceContainer } from "@/server/application/service-container";
import { nextAuthSessionService } from "@/server/infrastructure/auth/nextauth-session-service";
import { prismaAuthzRepository } from "@/server/infrastructure/repository/authz/prisma-authz-repository";
import { prismaCircleParticipationRepository } from "@/server/infrastructure/repository/circle/prisma-circle-participation-repository";
import { prismaCircleRepository } from "@/server/infrastructure/repository/circle/prisma-circle-repository";
import { prismaCircleSessionParticipationRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-participation-repository";
import { prismaCircleSessionRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-repository";
import { prismaMatchHistoryRepository } from "@/server/infrastructure/repository/match-history/prisma-match-history-repository";
import { prismaMatchRepository } from "@/server/infrastructure/repository/match/prisma-match-repository";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";
import { prismaSignupRepository } from "@/server/infrastructure/repository/user/prisma-signup-repository";
import { prismaCircleInviteLinkRepository } from "@/server/infrastructure/repository/circle/prisma-circle-invite-link-repository";
import { prismaUnitOfWork } from "@/server/infrastructure/transaction/prisma-unit-of-work";
import {
  hashPassword,
  verifyPassword,
} from "@/server/infrastructure/auth/password";

const getSession = createGetSession(nextAuthSessionService);

const buildServiceContainer = (): ServiceContainer =>
  createServiceContainer({
    circleRepository: prismaCircleRepository,
    circleParticipationRepository: prismaCircleParticipationRepository,
    circleSessionRepository: prismaCircleSessionRepository,
    matchRepository: prismaMatchRepository,
    matchHistoryRepository: prismaMatchHistoryRepository,
    circleSessionParticipationRepository:
      prismaCircleSessionParticipationRepository,
    userRepository: prismaUserRepository,
    authzRepository: prismaAuthzRepository,
    signupRepository: prismaSignupRepository,
    circleInviteLinkRepository: prismaCircleInviteLinkRepository,
    passwordUtils: { hash: hashPassword, verify: verifyPassword },
    unitOfWork: prismaUnitOfWork,
  });

export const createContext = async () => {
  const session = await getSession();
  const actorId = session?.user?.id ?? null;
  const services = buildServiceContainer();

  return {
    actorId,
    ...services,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
