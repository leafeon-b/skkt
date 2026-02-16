import { z } from "zod";
import { circleIdSchema, userIdSchema } from "@/server/presentation/dto/ids";
import { circleRoleSchema } from "@/server/presentation/dto/roles";

export const circleParticipationDtoSchema = z.object({
  userId: userIdSchema,
  role: circleRoleSchema,
});

export type CircleParticipationDto = z.infer<
  typeof circleParticipationDtoSchema
>;

export const circleParticipationListInputSchema = z.object({
  circleId: circleIdSchema,
});

export type CircleParticipationListInput = z.infer<
  typeof circleParticipationListInputSchema
>;

export const circleParticipationCreateInputSchema = z.object({
  circleId: circleIdSchema,
  userId: userIdSchema,
  role: circleRoleSchema,
});

export type CircleParticipationCreateInput = z.infer<
  typeof circleParticipationCreateInputSchema
>;

export const circleParticipationRoleUpdateInputSchema = z.object({
  circleId: circleIdSchema,
  userId: userIdSchema,
  role: circleRoleSchema,
});

export type CircleParticipationRoleUpdateInput = z.infer<
  typeof circleParticipationRoleUpdateInputSchema
>;

export const circleParticipationRemoveInputSchema = z.object({
  circleId: circleIdSchema,
  userId: userIdSchema,
});

export type CircleParticipationRemoveInput = z.infer<
  typeof circleParticipationRemoveInputSchema
>;

export const circleWithdrawInputSchema = z.object({
  circleId: circleIdSchema,
});

export type CircleWithdrawInput = z.infer<typeof circleWithdrawInputSchema>;

export const circleTransferOwnershipInputSchema = z.object({
  circleId: circleIdSchema,
  fromUserId: userIdSchema,
  toUserId: userIdSchema,
});

export type CircleTransferOwnershipInput = z.infer<
  typeof circleTransferOwnershipInputSchema
>;
