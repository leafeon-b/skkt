import { LOGIN_RATE_LIMIT_CONFIG } from "@/server/infrastructure/auth/auth-config";
import { createNextAuthHandler } from "@/server/infrastructure/auth/nextauth-handler";
import { createInMemoryRateLimiter } from "@/server/infrastructure/rate-limit/in-memory-rate-limiter";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";

const handler = createNextAuthHandler({
  userRepository: prismaUserRepository,
  loginRateLimiter: createInMemoryRateLimiter(LOGIN_RATE_LIMIT_CONFIG),
});

export { handler as GET, handler as POST };
