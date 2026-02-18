import { createCircleInviteLinkService } from "@/server/application/circle/circle-invite-link-service";
import { createAccessService } from "@/server/application/authz/access-service";
import { nextAuthSessionService } from "@/server/infrastructure/auth/nextauth-session-service";
import { prismaCircleInviteLinkRepository } from "@/server/infrastructure/repository/circle/prisma-circle-invite-link-repository";
import { prismaCircleRepository } from "@/server/infrastructure/repository/circle/prisma-circle-repository";
import { prismaCircleParticipationRepository } from "@/server/infrastructure/repository/circle/prisma-circle-participation-repository";
import { prismaAuthzRepository } from "@/server/infrastructure/repository/authz/prisma-authz-repository";

export type InviteLinkPageData = {
  circleName: string;
  circleId: string;
  expired: boolean;
  isAuthenticated: boolean;
};

const circleInviteLinkService = createCircleInviteLinkService({
  circleInviteLinkRepository: prismaCircleInviteLinkRepository,
  circleRepository: prismaCircleRepository,
  circleParticipationRepository: prismaCircleParticipationRepository,
  accessService: createAccessService(prismaAuthzRepository),
});

export async function getInviteLinkPageData(
  token: string,
): Promise<InviteLinkPageData | null> {
  let info;
  try {
    info = await circleInviteLinkService.getInviteLinkInfo({ token });
  } catch {
    return null;
  }

  const session = await nextAuthSessionService.getSession();
  const isAuthenticated = !!session?.user;

  return {
    circleName: info.circleName,
    circleId: info.circleId as string,
    expired: info.expired,
    isAuthenticated,
  };
}
