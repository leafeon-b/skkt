import { z } from "zod";
import {
  matchHistoryIdSchema,
  matchIdSchema,
  userIdSchema,
} from "@/server/presentation/dto/ids";
import { matchOutcomeSchema } from "@/server/presentation/dto/match";

const matchHistoryActionValues = ["CREATE", "UPDATE", "DELETE"] as const;

export const matchHistoryActionSchema = z.enum(matchHistoryActionValues);

export const matchHistoryDtoSchema = z.object({
  id: matchHistoryIdSchema,
  matchId: matchIdSchema,
  editorId: userIdSchema,
  action: matchHistoryActionSchema,
  createdAt: z.date(),
  player1Id: userIdSchema,
  player2Id: userIdSchema,
  outcome: matchOutcomeSchema,
});

export type MatchHistoryDto = z.infer<typeof matchHistoryDtoSchema>;

export const matchHistoryListInputSchema = z.object({
  matchId: matchIdSchema,
});

export type MatchHistoryListInput = z.infer<typeof matchHistoryListInputSchema>;
