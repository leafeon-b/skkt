import { z } from "zod";
import {
  circleIdSchema,
  circleSessionIdSchema,
  userIdSchema,
} from "@/server/presentation/dto/ids";

const textSchema = z.string().trim().min(1);

export const circleSessionStatusSchema = z.enum(["scheduled", "done", "draft"]);

export type CircleSessionStatusDto = z.infer<typeof circleSessionStatusSchema>;

export const userSessionSummaryDtoSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  circleId: circleIdSchema,
  circleName: textSchema,
  title: textSchema,
  startsAt: z.date(),
  endsAt: z.date(),
  location: z.string().nullable(),
  status: circleSessionStatusSchema,
  note: z.string().optional(),
});

export type UserSessionSummaryDto = z.infer<typeof userSessionSummaryDtoSchema>;

export const userSessionRecentInputSchema = z.object({
  userId: userIdSchema,
  limit: z.number().int().positive().max(50).optional(),
});

export type UserSessionRecentInput = z.infer<
  typeof userSessionRecentInputSchema
>;

export const userSessionNextInputSchema = z.object({
  userId: userIdSchema,
});

export type UserSessionNextInput = z.infer<typeof userSessionNextInputSchema>;
