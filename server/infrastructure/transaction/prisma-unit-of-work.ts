import type { UnitOfWork } from "@/server/application/common/unit-of-work";
import { prisma } from "@/server/infrastructure/db";
import { createPrismaCircleRepository } from "@/server/infrastructure/repository/circle/prisma-circle-repository";
import { createPrismaCircleParticipationRepository } from "@/server/infrastructure/repository/circle/prisma-circle-participation-repository";
import { createPrismaCircleSessionRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-repository";
import { createPrismaCircleSessionParticipationRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-participation-repository";
import { createPrismaMatchRepository } from "@/server/infrastructure/repository/match/prisma-match-repository";
import { createPrismaMatchHistoryRepository } from "@/server/infrastructure/repository/match-history/prisma-match-history-repository";
import { createPrismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";
import { createPrismaSignupRepository } from "@/server/infrastructure/repository/user/prisma-signup-repository";
import { createPrismaAuthzRepository } from "@/server/infrastructure/repository/authz/prisma-authz-repository";

export const prismaUnitOfWork: UnitOfWork = (operation) =>
  prisma.$transaction(async (tx) =>
    operation({
      circleRepository: createPrismaCircleRepository(tx),
      circleParticipationRepository:
        createPrismaCircleParticipationRepository(tx),
      circleSessionRepository: createPrismaCircleSessionRepository(tx),
      circleSessionParticipationRepository:
        createPrismaCircleSessionParticipationRepository(tx),
      matchRepository: createPrismaMatchRepository(tx),
      matchHistoryRepository: createPrismaMatchHistoryRepository(tx),
      userRepository: createPrismaUserRepository(tx),
      signupRepository: createPrismaSignupRepository(tx),
      authzRepository: createPrismaAuthzRepository(tx),
    }),
  );
