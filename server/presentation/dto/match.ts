import { z } from "zod";
import {
  circleSessionIdSchema,
  matchIdSchema,
  userIdSchema,
} from "@/server/presentation/dto/ids";

const matchOutcomeValues = ["P1_WIN", "P2_WIN", "DRAW", "UNKNOWN"] as const;

export const matchOutcomeSchema = z.enum(matchOutcomeValues);

export const matchDtoSchema = z.object({
  id: matchIdSchema,
  circleSessionId: circleSessionIdSchema,
  createdAt: z.date(),
  player1Id: userIdSchema,
  player2Id: userIdSchema,
  outcome: matchOutcomeSchema,
  deletedAt: z.date().nullable(),
});

export type MatchDto = z.infer<typeof matchDtoSchema>;

export const matchGetInputSchema = z.object({
  matchId: matchIdSchema,
});

export type MatchGetInput = z.infer<typeof matchGetInputSchema>;

export const matchListInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type MatchListInput = z.infer<typeof matchListInputSchema>;

export const matchCreateInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  player1Id: userIdSchema,
  player2Id: userIdSchema,
  outcome: matchOutcomeSchema.optional(),
});

export type MatchCreateInput = z.infer<typeof matchCreateInputSchema>;

export const matchUpdateInputSchema = z
  .object({
    matchId: matchIdSchema,
    player1Id: userIdSchema.optional(),
    player2Id: userIdSchema.optional(),
    outcome: matchOutcomeSchema.optional(),
  })
  .refine(
    (value) =>
      (value.player1Id && value.player2Id) ||
      (!value.player1Id && !value.player2Id),
    {
      message: "player1Id and player2Id must both be provided",
      path: ["player1Id"],
    },
  );

export type MatchUpdateInput = z.infer<typeof matchUpdateInputSchema>;

export const matchDeleteInputSchema = matchGetInputSchema;
export type MatchDeleteInput = z.infer<typeof matchDeleteInputSchema>;
