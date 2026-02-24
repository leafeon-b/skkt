import { z } from "zod";
import { circleIdSchema } from "@/server/presentation/dto/ids";
import { circleRoleSchema } from "@/server/presentation/dto/roles";

const textSchema = z.string().trim().min(1);

export const userCircleMembershipListInputSchema = z.object({});

export type UserCircleMembershipListInput = z.infer<
  typeof userCircleMembershipListInputSchema
>;

export const userCircleMembershipDtoSchema = z.object({
  circleId: circleIdSchema,
  circleName: textSchema,
  role: circleRoleSchema,
});

export type UserCircleMembershipDto = z.infer<
  typeof userCircleMembershipDtoSchema
>;
