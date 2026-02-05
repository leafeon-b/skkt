import { getServerSession } from "next-auth";
import { createAuthOptions } from "@/server/infrastructure/auth/nextauth-handler";
import { UnauthorizedError } from "@/server/domain/common/errors";

export const getSession = async () => getServerSession(createAuthOptions());

export const getSessionUserId = async (): Promise<string> => {
  const session = await getSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
};
