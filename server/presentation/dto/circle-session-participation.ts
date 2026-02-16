import { z } from "zod";
import {
  circleSessionIdSchema,
  userIdSchema,
} from "@/server/presentation/dto/ids";
import { circleSessionRoleSchema } from "@/server/presentation/dto/roles";

export const circleSessionParticipationDtoSchema = z.object({
  userId: userIdSchema,
  role: circleSessionRoleSchema,
});

export type CircleSessionParticipationDto = z.infer<
  typeof circleSessionParticipationDtoSchema
>;

export const circleSessionParticipationListInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
});

export type CircleSessionParticipationListInput = z.infer<
  typeof circleSessionParticipationListInputSchema
>;

export const circleSessionParticipationCreateInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  userId: userIdSchema,
  role: circleSessionRoleSchema,
});

export type CircleSessionParticipationCreateInput = z.infer<
  typeof circleSessionParticipationCreateInputSchema
>;

export const circleSessionParticipationRoleUpdateInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  userId: userIdSchema,
  role: circleSessionRoleSchema,
});

export type CircleSessionParticipationRoleUpdateInput = z.infer<
  typeof circleSessionParticipationRoleUpdateInputSchema
>;

export const circleSessionParticipationRemoveInputSchema = z.object({
  circleSessionId: circleSessionIdSchema,
  userId: userIdSchema,
});

export type CircleSessionParticipationRemoveInput = z.infer<
  typeof circleSessionParticipationRemoveInputSchema
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
