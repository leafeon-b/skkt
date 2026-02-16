import { createCircleInviteLinkService } from "@/server/application/circle/circle-invite-link-service";
import { createAccessService } from "@/server/application/authz/access-service";
import { prismaCircleInviteLinkRepository } from "@/server/infrastructure/repository/circle/prisma-circle-invite-link-repository";
import { prismaCircleRepository } from "@/server/infrastructure/repository/circle/prisma-circle-repository";
import { prismaCircleParticipationRepository } from "@/server/infrastructure/repository/circle/prisma-circle-participation-repository";
import { prismaAuthzRepository } from "@/server/infrastructure/repository/authz/prisma-authz-repository";
import { nextAuthSessionService } from "@/server/infrastructure/auth/nextauth-session-service";
import { createInviteLinkProvider } from "@/server/presentation/providers/invite-link-provider";

export const inviteLinkProvider = createInviteLinkProvider({
  circleInviteLinkService: createCircleInviteLinkService({
    circleInviteLinkRepository: prismaCircleInviteLinkRepository,
    circleRepository: prismaCircleRepository,
    circleParticipationRepository: prismaCircleParticipationRepository,
    accessService: createAccessService(prismaAuthzRepository),
  }),
  sessionService: nextAuthSessionService,
});
