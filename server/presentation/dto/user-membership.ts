import { z } from "zod";
import { circleIdSchema, userIdSchema } from "@/server/presentation/dto/ids";
import { circleRoleSchema } from "@/server/presentation/dto/roles";

const textSchema = z.string().trim().min(1);

export const userMembershipDtoSchema = z.object({
  circleId: circleIdSchema,
  circleName: textSchema,
  role: circleRoleSchema,
});

export type UserMembershipDto = z.infer<typeof userMembershipDtoSchema>;

export const userMembershipListInputSchema = z.object({
  userId: userIdSchema,
});

export type UserMembershipListInput = z.infer<
  typeof userMembershipListInputSchema
>;
