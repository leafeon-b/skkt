import { z } from "zod";
import {
  circleIdSchema,
  circleSessionIdSchema,
  roundRobinScheduleIdSchema,
  userIdSchema,
} from "@/server/presentation/dto/ids";

const playerDtoSchema = z.object({
  id: userIdSchema,
  name: z.string().nullable(),
  image: z.string().nullable(),
});

export const pairingDtoSchema = z.object({
  player1: playerDtoSchema,
  player2: playerDtoSchema,
});

export type PairingDto = z.infer<typeof pairingDtoSchema>;

export const roundDtoSchema = z.object({
  roundNumber: z.number().int().positive(),
  pairings: pairingDtoSchema.array(),
});

export type RoundDto = z.infer<typeof roundDtoSchema>;

export const roundRobinScheduleDtoSchema = z.object({
  id: roundRobinScheduleIdSchema,
  circleSessionId: circleSessionIdSchema,
  rounds: roundDtoSchema.array(),
  totalMatchCount: z.number().int().nonnegative(),
  createdAt: z.date(),
});

export type RoundRobinScheduleDto = z.infer<typeof roundRobinScheduleDtoSchema>;

export const roundRobinScheduleGetInputSchema = z.object({
  circleId: circleIdSchema,
  circleSessionId: circleSessionIdSchema,
});

export type RoundRobinScheduleGetInput = z.infer<
  typeof roundRobinScheduleGetInputSchema
>;

export const roundRobinScheduleGenerateInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type RoundRobinScheduleGenerateInput = z.infer<
  typeof roundRobinScheduleGenerateInputSchema
>;

export const roundRobinScheduleDeleteInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type RoundRobinScheduleDeleteInput = z.infer<
  typeof roundRobinScheduleDeleteInputSchema
>;
