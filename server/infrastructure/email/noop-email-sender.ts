import type { EmailSender } from "@/server/domain/common/email-sender";

export const noopEmailSender: EmailSender = {
  async send() {},
};
