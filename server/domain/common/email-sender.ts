export type EmailMessage = {
  to: string[];
  subject: string;
  body: string;
  headers?: Record<string, string>;
};

export type EmailSender = {
  send(message: EmailMessage): Promise<void>;
};
