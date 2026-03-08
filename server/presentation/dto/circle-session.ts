import { z } from "zod";
import {
  CIRCLE_SESSION_LOCATION_MAX_LENGTH,
  CIRCLE_SESSION_NOTE_MAX_LENGTH,
  CIRCLE_SESSION_TITLE_MAX_LENGTH,
} from "@/server/domain/models/circle-session/circle-session";
import {
  circleIdSchema,
  circleSessionIdSchema,
} from "@/server/presentation/dto/ids";
import { trimWithFullwidth } from "@/lib/string";

const dateInputSchema = z.coerce.date();

export const circleSessionDtoSchema = z.object({
  id: circleSessionIdSchema,
  circleId: circleIdSchema,
  title: z.string().min(1),
  startsAt: z.date(),
  endsAt: z.date(),
  location: z.string().max(CIRCLE_SESSION_LOCATION_MAX_LENGTH).nullable(),
  note: z.string(),
  createdAt: z.date(),
});

export type CircleSessionDto = z.infer<typeof circleSessionDtoSchema>;

export const circleSessionGetInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type CircleSessionGetInput = z.infer<typeof circleSessionGetInputSchema>;

export const circleSessionListInputSchema = z.object({
  circleId: circleIdSchema,
});

export type CircleSessionListInput = z.infer<
  typeof circleSessionListInputSchema
>;

export const circleSessionCreateInputSchema = z.object({
  circleId: circleIdSchema,
  title: z
    .string()
    .transform(trimWithFullwidth)
    .pipe(z.string().min(1).max(CIRCLE_SESSION_TITLE_MAX_LENGTH)),
  startsAt: dateInputSchema,
  endsAt: dateInputSchema,
  location: z.string().max(CIRCLE_SESSION_LOCATION_MAX_LENGTH).nullable().optional(),
  note: z.string().max(CIRCLE_SESSION_NOTE_MAX_LENGTH).optional(),
});

export type CircleSessionCreateInput = z.infer<
  typeof circleSessionCreateInputSchema
>;

export const circleSessionUpdateInputSchema = z
  .object({
    circleSessionId: circleSessionIdSchema,
    title: z
      .string()
      .transform(trimWithFullwidth)
      .pipe(z.string().min(1).max(CIRCLE_SESSION_TITLE_MAX_LENGTH))
      .optional(),
    startsAt: dateInputSchema.optional(),
    endsAt: dateInputSchema.optional(),
    location: z.string().max(CIRCLE_SESSION_LOCATION_MAX_LENGTH).nullable().optional(),
    note: z.string().max(CIRCLE_SESSION_NOTE_MAX_LENGTH).optional(),
  })
  .refine(
    (value) =>
      (value.startsAt && value.endsAt) || (!value.startsAt && !value.endsAt),
    {
      message: "startsAt and endsAt must both be provided",
      path: ["startsAt"],
    },
  );

export type CircleSessionUpdateInput = z.infer<
  typeof circleSessionUpdateInputSchema
>;

export const circleSessionDeleteInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type CircleSessionDeleteInput = z.infer<
  typeof circleSessionDeleteInputSchema
>;
