import { z } from "zod";
import {
  circleIdSchema,
  circleSessionIdSchema,
} from "@/server/presentation/dto/ids";

const textSchema = z.string().trim().min(1);

export const userCircleSessionParticipationListInputSchema = z.object({
  limit: z.number().int().positive().max(50).optional(),
});

export type UserCircleSessionParticipationListInput = z.infer<
  typeof userCircleSessionParticipationListInputSchema
>;

export const userCircleSessionParticipationSummaryDtoSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  circleId: circleIdSchema,
  circleName: textSchema,
  title: textSchema,
  startsAt: z.date(),
  endsAt: z.date(),
  location: z.string().nullable(),
});

export type UserCircleSessionParticipationSummaryDto = z.infer<
  typeof userCircleSessionParticipationSummaryDtoSchema
>;
