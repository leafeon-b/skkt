import { LOGIN_RATE_LIMIT_CONFIG } from "@/server/infrastructure/auth/auth-config";
import { createNextAuthHandler } from "@/server/infrastructure/auth/nextauth-handler";
import { getClientIp } from "@/server/infrastructure/http/client-ip";
import { createPrismaRateLimiter } from "@/server/infrastructure/rate-limit/prisma-rate-limiter";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";

const loginRateLimiter = createPrismaRateLimiter(LOGIN_RATE_LIMIT_CONFIG);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = (request: Request, context: any) => {
  const clientIp = getClientIp(request);
  const nextAuthHandler = createNextAuthHandler({
    userRepository: prismaUserRepository,
    loginRateLimiter,
    getClientIp: () => clientIp,
  });
  return nextAuthHandler(request, context);
};

export { handler as GET, handler as POST };
