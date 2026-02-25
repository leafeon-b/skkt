import { LOGIN_RATE_LIMIT_CONFIG } from "@/server/infrastructure/auth/auth-config";
import { createNextAuthHandler } from "@/server/infrastructure/auth/nextauth-handler";
import { createPrismaRateLimiter } from "@/server/infrastructure/rate-limit/prisma-rate-limiter";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";

const handler = createNextAuthHandler({
  userRepository: prismaUserRepository,
  loginRateLimiter: createPrismaRateLimiter(LOGIN_RATE_LIMIT_CONFIG),
});

export { handler as GET, handler as POST };
