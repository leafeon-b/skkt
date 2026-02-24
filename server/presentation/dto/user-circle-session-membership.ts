import { z } from "zod";
import {
  circleIdSchema,
  circleSessionIdSchema,
} from "@/server/presentation/dto/ids";

const textSchema = z.string().trim().min(1);

export const userCircleSessionMembershipListInputSchema = z.object({
  limit: z.number().int().positive().max(50).optional(),
});

export type UserCircleSessionMembershipListInput = z.infer<
  typeof userCircleSessionMembershipListInputSchema
>;

export const userCircleSessionMembershipSummaryDtoSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  circleId: circleIdSchema,
  circleName: textSchema,
  title: textSchema,
  startsAt: z.date(),
  endsAt: z.date(),
  location: z.string().nullable(),
});

export type UserCircleSessionMembershipSummaryDto = z.infer<
  typeof userCircleSessionMembershipSummaryDtoSchema
>;
