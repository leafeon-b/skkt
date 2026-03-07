import { userId, type UserId } from "@/server/domain/common/ids";
import type { NotificationPreference } from "@/server/domain/models/notification-preference/notification-preference";
import type { NotificationPreferenceRepository } from "@/server/domain/models/notification-preference/notification-preference-repository";
import type { UnsubscribeTokenService } from "@/server/domain/services/unsubscribe-token";

export type NotificationPreferenceServiceDeps = {
  notificationPreferenceRepository: NotificationPreferenceRepository;
  unsubscribeTokenService: UnsubscribeTokenService;
};

export const createNotificationPreferenceService = (
  deps: NotificationPreferenceServiceDeps,
) => {
  return {
    async getPreference(userId: UserId): Promise<NotificationPreference> {
      const pref =
        await deps.notificationPreferenceRepository.findByUserId(userId);
      return pref ?? { userId, emailEnabled: true };
    },

    async updatePreference(
      userId: UserId,
      emailEnabled: boolean,
    ): Promise<NotificationPreference> {
      const pref: NotificationPreference = { userId, emailEnabled };
      await deps.notificationPreferenceRepository.save(pref);
      return pref;
    },

    async disableByToken(token: string): Promise<NotificationPreference | null> {
      const extractedUserId = deps.unsubscribeTokenService.verify(token);
      if (!extractedUserId) return null;
      return this.updatePreference(userId(extractedUserId), false);
    },
  };
};
