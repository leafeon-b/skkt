import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { createNotificationService } from "@/server/application/notification/notification-service";

type NotificationRecord = {
  session: CircleSession;
  circleName: string;
  actorId: string;
};

export const createFakeNotificationService = (): ReturnType<
  typeof createNotificationService
> & {
  notifications: NotificationRecord[];
  failOnNextCall(error: Error): void;
} => {
  const notifications: NotificationRecord[] = [];
  let pendingError: Error | null = null;
  return {
    notifications,
    failOnNextCall(error) {
      pendingError = error;
    },
    async notifySessionCreated(session, circleName, actorId) {
      if (pendingError) {
        const e = pendingError;
        pendingError = null;
        throw e;
      }
      notifications.push({ session, circleName, actorId });
    },
  };
};
