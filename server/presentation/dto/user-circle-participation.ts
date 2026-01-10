import { z } from "zod";
import { circleIdSchema } from "@/server/presentation/dto/ids";
import { circleRoleSchema } from "@/server/presentation/dto/roles";

const textSchema = z.string().trim().min(1);

export const userCircleParticipationListInputSchema = z.object({});

export type UserCircleParticipationListInput = z.infer<
  typeof userCircleParticipationListInputSchema
>;

export const userCircleParticipationDtoSchema = z.object({
  circleId: circleIdSchema,
  circleName: textSchema,
  role: circleRoleSchema,
});

export type UserCircleParticipationDto = z.infer<
  typeof userCircleParticipationDtoSchema
>;
