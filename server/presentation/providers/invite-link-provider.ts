import { NotFoundError } from "@/server/domain/common/errors";
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
  const ctx = await createPublicContext();

  let info;
  try {
    info = await ctx.circleInviteLinkService.getInviteLinkInfo({ token });
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
