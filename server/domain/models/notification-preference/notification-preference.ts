import type { UserId } from "@/server/domain/common/ids";

export type NotificationPreference = {
  userId: UserId;
  emailEnabled: boolean;
};

const DEFAULT_EMAIL_ENABLED = true;

export const createDefaultPreference = (
  userId: UserId,
): NotificationPreference => ({
  userId,
  emailEnabled: DEFAULT_EMAIL_ENABLED,
});
