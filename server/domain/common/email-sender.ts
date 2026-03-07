export type EmailMessage = {
  to: string[];
  subject: string;
  body: string;
};

export type EmailSender = {
  send(message: EmailMessage): Promise<void>;
};
