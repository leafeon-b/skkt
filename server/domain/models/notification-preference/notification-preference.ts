import type { UserId } from "@/server/domain/common/ids";

export type NotificationPreference = {
  userId: UserId;
  emailEnabled: boolean;
};
