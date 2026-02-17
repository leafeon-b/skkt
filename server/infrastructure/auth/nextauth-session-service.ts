import { getServerSession } from "next-auth";
import type { SessionService } from "@/server/domain/services/auth/session-service";
import { createAuthOptions } from "./nextauth-handler";
import { prismaUserRepository } from "@/server/infrastructure/repository/user/prisma-user-repository";

export const nextAuthSessionService: SessionService = {
  async getSession() {
    const session = await getServerSession(
      createAuthOptions({ userRepository: prismaUserRepository }),
    );
    if (!session?.user) {
      return null;
    }
    const user = session.user as {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    if (!user.id) {
      return null;
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  },
};
