import { BadRequestError, NotFoundError } from "@/server/domain/common/errors";
import { inviteLinkToken } from "@/server/domain/common/ids";
import { createPublicContext } from "@/server/presentation/trpc/context";

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
    validatedToken = inviteLinkToken(token);
  } catch (e) {
    if (e instanceof BadRequestError) return null;
    throw e;
  }

  const ctx = await createPublicContext();

  let info;
  try {
    info = await ctx.circleInviteLinkService.getInviteLinkInfo({
      token: validatedToken,
    });
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }

  return {
    circleName: info.circleName,
    circleId: info.circleId,
    expired: info.expired,
    isAuthenticated: ctx.actorId !== null,
  };
}
