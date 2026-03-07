import { env } from "@/server/env";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { NotificationPreferenceRepository } from "@/server/domain/models/notification-preference/notification-preference-repository";
import type { UnsubscribeTokenService } from "@/server/domain/services/unsubscribe-token";
import type { EmailSender } from "@/server/domain/common/email-sender";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import { userId } from "@/server/domain/common/ids";

export type NotificationServiceDeps = {
  circleRepository: CircleRepository;
  userRepository: UserRepository;
  notificationPreferenceRepository: NotificationPreferenceRepository;
  unsubscribeTokenService: UnsubscribeTokenService;
  emailSender: EmailSender;
};

export const createNotificationService = (deps: NotificationServiceDeps) => {
  return {
    async notifySessionCreated(
      session: CircleSession,
      circleName: string,
      actorId: string,
    ): Promise<void> {
      const circle = await deps.circleRepository.findById(session.circleId);
      if (!circle || !circle.sessionEmailNotificationEnabled) return;

      const memberships =
        await deps.circleRepository.listMembershipsByCircleId(
          session.circleId,
        );

      const otherMembers = memberships.filter(
        (m) => m.userId !== userId(actorId) && m.deletedAt === null,
      );

      if (otherMembers.length === 0) return;

      const users = await deps.userRepository.findByIds(
        otherMembers.map((m) => m.userId),
      );

      const usersWithEmail = users.filter((u) => u.email !== null);
      if (usersWithEmail.length === 0) return;

      // Check notification preferences — users without a record are not in this
      // array, so they remain in the eligible list (default: enabled).
      // See: createDefaultPreference() in notification-preference.ts
      const prefs =
        await deps.notificationPreferenceRepository.findByUserIds(
          usersWithEmail.map((u) => u.id),
        );
      const disabledUserIds = new Set(
        prefs.filter((p) => !p.emailEnabled).map((p) => String(p.userId)),
      );

      const eligibleUsers = usersWithEmail.filter(
        (u) => !disabledUserIds.has(String(u.id)),
      );
      if (eligibleUsers.length === 0) return;

      const startDate = session.startsAt.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
      const startTime = session.startsAt.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endTime = session.endsAt.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const locationLine = session.location
        ? `場所: ${session.location}\n`
        : "";

      const baseUrl = env.BASE_URL;
      const sessionUrl = baseUrl
        ? `${baseUrl}/circle-sessions/${session.id}`
        : null;

      const sessionFooter = sessionUrl
        ? `詳細はこちら: ${sessionUrl}`
        : "SKKT でご確認ください。";

      await Promise.all(
        eligibleUsers.map((user) => {
          const unsubscribeToken = deps.unsubscribeTokenService.generate(
            String(user.id),
          );
          const unsubscribeUrl = baseUrl
            ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
            : null;
          const unsubscribeFooter = unsubscribeUrl
            ? `\n---\nメール配信を停止する: ${unsubscribeUrl}`
            : "";

          const body = [
            `${circleName} に新しいセッションが作成されました。`,
            "",
            `タイトル: ${session.title}`,
            `日時: ${startDate} ${startTime} - ${endTime}`,
            locationLine.trimEnd(),
            "",
            sessionFooter,
            unsubscribeFooter,
          ]
            .filter((line) => line !== undefined)
            .join("\n");

          const unsubscribeApiUrl = baseUrl
            ? `${baseUrl}/api/unsubscribe?token=${unsubscribeToken}`
            : null;

          const headers: Record<string, string> = {};
          if (unsubscribeApiUrl) {
            headers["List-Unsubscribe"] = `<${unsubscribeApiUrl}>`;
            headers["List-Unsubscribe-Post"] =
              "List-Unsubscribe=One-Click";
          }

          return deps.emailSender.send({
            to: [user.email!],
            subject: `[${circleName}] ${session.title}`,
            body,
            ...(Object.keys(headers).length > 0 && { headers }),
          });
        }),
      );
    },
  };
};
