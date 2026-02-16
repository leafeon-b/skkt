import type { createCircleInviteLinkService } from "@/server/application/circle/circle-invite-link-service";
import type { SessionService } from "@/server/domain/services/auth/session-service";

type CircleInviteLinkService = ReturnType<typeof createCircleInviteLinkService>;

export type InviteLinkPageData = {
  circleName: string;
  circleId: string;
  expired: boolean;
  isAuthenticated: boolean;
};

export type InviteLinkProviderDeps = {
  circleInviteLinkService: CircleInviteLinkService;
  sessionService: SessionService;
};

export const createInviteLinkProvider = (deps: InviteLinkProviderDeps) => ({
  async getPageData(token: string): Promise<InviteLinkPageData | null> {
    let info;
    try {
      info = await deps.circleInviteLinkService.getInviteLinkInfo({ token });
    } catch {
      return null;
    }

    const session = await deps.sessionService.getSession();
    const isAuthenticated = !!session?.user;

    return {
      circleName: info.circleName,
      circleId: info.circleId as string,
      expired: info.expired,
      isAuthenticated,
    };
  },
});
