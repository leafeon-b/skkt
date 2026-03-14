import { after } from "next/server";
import { env } from "@/server/env";
import {
  createGetSession,
  createGetSessionUserId,
} from "@/server/application/auth/session";
import { createServiceContainer } from "@/server/infrastructure/service-container";
import type { ServiceContainer } from "@/server/infrastructure/service-container";
import { toUserId } from "@/server/domain/common/ids";
import { nextAuthSessionService } from "@/server/infrastructure/auth/nextauth-session-service";
import { prismaAuthzRepository } from "@/server/infrastructure/repository/authz/prisma-authz-repository";
import { prismaCircleRepository } from "@/server/infrastructure/repository/circle/prisma-circle-repository";
import { prismaCircleSessionRepository } from "@/server/infrastructure/repository/circle-session/prisma-circle-session-repository";
import { prismaMatchRepository } from "@/server/infrastructure/repository/match/prisma-match-repository";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";
import { prismaCircleInviteLinkRepository } from "@/server/infrastructure/repository/circle-invite-link/prisma-circle-invite-link-repository";
import { prismaRoundRobinScheduleRepository } from "@/server/infrastructure/repository/round-robin-schedule/prisma-round-robin-schedule-repository";
import { prismaNotificationPreferenceRepository } from "@/server/infrastructure/repository/notification-preference/prisma-notification-preference-repository";
import { prismaUnitOfWork } from "@/server/infrastructure/transaction/prisma-unit-of-work";
import {
  hashPassword,
  verifyPassword,
} from "@/server/infrastructure/auth/password";
import { createJapaneseHolidayProvider } from "@/server/infrastructure/holiday/japanese-holiday-provider";
import { createPrismaRateLimiter } from "@/server/infrastructure/rate-limit/prisma-rate-limiter";
import { getClientIp } from "@/server/infrastructure/http/client-ip";
import { createResendEmailSender } from "@/server/infrastructure/email/resend-email-sender";
import { noopEmailSender } from "@/server/infrastructure/email/noop-email-sender";
import { createUnsubscribeTokenService } from "@/server/domain/services/unsubscribe-token";

const getSession = createGetSession(nextAuthSessionService);

/** @internal Route Handler 等から認証済みユーザーIDを取得する */
export const getSessionUserId = createGetSessionUserId(nextAuthSessionService);
const japaneseHolidayProvider = createJapaneseHolidayProvider();
const emailSender = env.RESEND_API_KEY
  ? createResendEmailSender(env.RESEND_API_KEY)
  : noopEmailSender;

const unsubscribeTokenService = createUnsubscribeTokenService(
  env.UNSUBSCRIBE_SECRET,
);

const changePasswordRateLimiter = createPrismaRateLimiter({
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
  category: "changePassword",
});

/** @internal テスト・プロダクション共用。tRPC 外の Route Handler 等から利用可 */
export const buildServiceContainer = (): ServiceContainer =>
  createServiceContainer({
    circleRepository: prismaCircleRepository,
    circleSessionRepository: prismaCircleSessionRepository,
    matchRepository: prismaMatchRepository,
    userRepository: prismaUserRepository,
    authzRepository: prismaAuthzRepository,
    circleInviteLinkRepository: prismaCircleInviteLinkRepository,
    roundRobinScheduleRepository: prismaRoundRobinScheduleRepository,
    notificationPreferenceRepository: prismaNotificationPreferenceRepository,
    unsubscribeTokenService,
    passwordHasher: { hash: hashPassword, verify: verifyPassword },
    changePasswordRateLimiter,
    holidayProvider: japaneseHolidayProvider,
    emailSender,
    runInBackground: (promise) => after(promise),
    unitOfWork: prismaUnitOfWork,
  });

export const createContext = async (request?: Request) => {
  const session = await getSession();
  const actorId = session?.user?.id ? toUserId(session.user.id) : null;
  const services = buildServiceContainer();
  const clientIp = request ? getClientIp(request) : "unknown";

  return {
    actorId,
    clientIp,
    ...services,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
