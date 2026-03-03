import { z } from "zod";
import { circleIdSchema, userIdSchema } from "@/server/presentation/dto/ids";
import {
  assignableCircleRoleSchema,
  circleRoleSchema,
} from "@/server/presentation/dto/roles";

export const circleMembershipDtoSchema = z.object({
  userId: userIdSchema,
  role: circleRoleSchema,
});

export type CircleMembershipDto = z.infer<typeof circleMembershipDtoSchema>;

export const circleMembershipListInputSchema = z.object({
  circleId: circleIdSchema,
});

export type CircleMembershipListInput = z.infer<
  typeof circleMembershipListInputSchema
>;

export const circleMembershipCreateInputSchema = z.object({
  circleId: circleIdSchema,
  userId: userIdSchema,
  role: assignableCircleRoleSchema,
});

export type CircleMembershipCreateInput = z.infer<
  typeof circleMembershipCreateInputSchema
>;

export const circleMembershipRoleUpdateInputSchema = z.object({
  circleId: circleIdSchema,
  userId: userIdSchema,
  role: assignableCircleRoleSchema,
});

export type CircleMembershipRoleUpdateInput = z.infer<
  typeof circleMembershipRoleUpdateInputSchema
>;

export const circleMembershipRemoveInputSchema = z.object({
  circleId: circleIdSchema,
  userId: userIdSchema,
});

export type CircleMembershipRemoveInput = z.infer<
  typeof circleMembershipRemoveInputSchema
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
