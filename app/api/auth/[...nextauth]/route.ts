import { createNextAuthHandler } from "@/server/infrastructure/auth/nextauth-handler";
import { createInMemoryRateLimiter } from "@/server/infrastructure/rate-limit/in-memory-rate-limiter";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";

const handler = createNextAuthHandler({
  userRepository: prismaUserRepository,
  loginRateLimiter: createInMemoryRateLimiter({
    maxAttempts: 5,
    windowMs: 60_000,
  }),
});

export { handler as GET, handler as POST };
