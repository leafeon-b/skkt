import type { UserId } from "@/server/domain/common/ids";
import type { NotificationPreference } from "./notification-preference";

export type NotificationPreferenceRepository = {
  findByUserId(userId: UserId): Promise<NotificationPreference | null>;
  findByUserIds(
    userIds: readonly UserId[],
  ): Promise<NotificationPreference[]>;
  save(pref: NotificationPreference): Promise<void>;
};
