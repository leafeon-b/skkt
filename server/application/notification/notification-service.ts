import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { EmailSender } from "@/server/domain/common/email-sender";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import { userId } from "@/server/domain/common/ids";

export type NotificationServiceDeps = {
  circleRepository: CircleRepository;
  userRepository: UserRepository;
  emailSender: EmailSender;
};

export const createNotificationService = (deps: NotificationServiceDeps) => {
  return {
    async notifySessionCreated(
      session: CircleSession,
      circleName: string,
      actorId: string,
    ): Promise<void> {
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

      const emails = users
        .filter((u) => u.email !== null)
        .map((u) => u.email!);

      if (emails.length === 0) return;

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

      const body = [
        `${circleName} に新しいセッションが作成されました。`,
        "",
        `タイトル: ${session.title}`,
        `日時: ${startDate} ${startTime} - ${endTime}`,
        locationLine.trimEnd(),
        "",
        "SKKT でご確認ください。",
      ]
        .filter((line) => line !== undefined)
        .join("\n");

      await Promise.all(
        emails.map((email) =>
          deps.emailSender.send({
            to: [email],
            subject: `[${circleName}] ${session.title}`,
            body,
          }),
        ),
      );
    },
  };
};
