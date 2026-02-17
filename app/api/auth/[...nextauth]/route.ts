import { createNextAuthHandler } from "@/server/infrastructure/auth/nextauth-handler";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";

const handler = createNextAuthHandler({
  userRepository: prismaUserRepository,
});

export { handler as GET, handler as POST };
