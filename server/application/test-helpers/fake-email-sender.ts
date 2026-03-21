import type { EmailMessage, EmailSender } from "@/server/domain/common/email-sender";

export const createFakeEmailSender = (): EmailSender & {
  sentMessages: EmailMessage[];
} => {
  const sentMessages: EmailMessage[] = [];
  return {
    sentMessages,
    async send(message) {
      sentMessages.push(message);
    },
  };
};
