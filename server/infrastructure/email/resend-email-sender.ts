import { Resend } from "resend";
import type { EmailSender } from "@/server/domain/common/email-sender";

export const createResendEmailSender = (apiKey: string): EmailSender => {
  const resend = new Resend(apiKey);

  return {
    async send(message) {
      await resend.emails.send({
        from: "SKKT <noreply@skkt.dev>",
        to: message.to,
        subject: message.subject,
        text: message.body,
        headers: message.headers,
      });
    },
  };
};
