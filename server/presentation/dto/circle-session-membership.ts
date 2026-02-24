import { z } from "zod";
import {
  circleSessionIdSchema,
  userIdSchema,
} from "@/server/presentation/dto/ids";
import { circleSessionRoleSchema } from "@/server/presentation/dto/roles";

export const circleSessionMembershipDtoSchema = z.object({
  userId: userIdSchema,
  role: circleSessionRoleSchema,
});

export type CircleSessionMembershipDto = z.infer<
  typeof circleSessionMembershipDtoSchema
>;

export const circleSessionMembershipListInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type CircleSessionMembershipListInput = z.infer<
  typeof circleSessionMembershipListInputSchema
>;

export const circleSessionMembershipCreateInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  userId: userIdSchema,
  role: circleSessionRoleSchema,
});

export type CircleSessionMembershipCreateInput = z.infer<
  typeof circleSessionMembershipCreateInputSchema
>;

export const circleSessionMembershipRoleUpdateInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  userId: userIdSchema,
  role: circleSessionRoleSchema,
});

export type CircleSessionMembershipRoleUpdateInput = z.infer<
  typeof circleSessionMembershipRoleUpdateInputSchema
>;

export const circleSessionMembershipRemoveInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  userId: userIdSchema,
});

export type CircleSessionMembershipRemoveInput = z.infer<
  typeof circleSessionMembershipRemoveInputSchema
>;

export const circleSessionWithdrawInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type CircleSessionWithdrawInput = z.infer<
  typeof circleSessionWithdrawInputSchema
>;

export const circleSessionTransferOwnershipInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  fromUserId: userIdSchema,
  toUserId: userIdSchema,
});

export type CircleSessionTransferOwnershipInput = z.infer<
  typeof circleSessionTransferOwnershipInputSchema
>;
