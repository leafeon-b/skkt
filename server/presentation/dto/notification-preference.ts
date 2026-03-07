import { z } from "zod";

export const notificationPreferenceDtoSchema = z.object({
  emailEnabled: z.boolean(),
});

export type NotificationPreferenceDto = z.infer<
  typeof notificationPreferenceDtoSchema
>;

export const updateNotificationPreferenceInputSchema = z.object({
  emailEnabled: z.boolean(),
});

export type UpdateNotificationPreferenceInput = z.infer<
  typeof updateNotificationPreferenceInputSchema
>;
