import { z } from "zod";
import { circleIdSchema } from "@/server/presentation/dto/ids";

export const circleDtoSchema = z.object({
  id: circleIdSchema,
  name: z.string().trim().min(1),
  createdAt: z.date(),
});

export type CircleDto = z.infer<typeof circleDtoSchema>;

export const circleGetInputSchema = z.object({
  circleId: circleIdSchema,
});

export type CircleGetInput = z.infer<typeof circleGetInputSchema>;

export const circleCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export type CircleCreateInput = z.infer<typeof circleCreateInputSchema>;

export const circleRenameInputSchema = z.object({
  circleId: circleIdSchema,
  name: z.string().trim().min(1).max(50),
});

export type CircleRenameInput = z.infer<typeof circleRenameInputSchema>;

export const circleDeleteInputSchema = z.object({
  circleId: circleIdSchema,
});

export type CircleDeleteInput = z.infer<typeof circleDeleteInputSchema>;
