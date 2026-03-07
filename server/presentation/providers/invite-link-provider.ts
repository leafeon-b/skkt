import { TRPCError } from "@trpc/server";
import { BadRequestError } from "@/server/domain/common/errors";
import { toInviteLinkToken } from "@/server/domain/common/ids";
import { createContext } from "@/server/presentation/trpc/context";
import { appRouter } from "@/server/presentation/trpc/router";

export type InviteLinkPageData = {
  circleName: string;
  circleId: string;
  expired: boolean;
  isAuthenticated: boolean;
};

export async function getInviteLinkPageData(
  token: string,
): Promise<InviteLinkPageData | null> {
  let validatedToken;
  try {
    validatedToken = toInviteLinkToken(token);
  } catch (e) {
    if (e instanceof BadRequestError) return null;
    throw e;
  }

  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  let info;
  try {
    info = await caller.circles.inviteLinks.getInfo({
      token: validatedToken,
    });
  } catch (e) {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") return null;
    throw e;
  }

  return {
    circleName: info.circleName,
    circleId: info.circleId,
    expired: info.expired,
    isAuthenticated: ctx.actorId !== null,
  };
}
