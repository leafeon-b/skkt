import { z } from "zod";
import {
  circleIdSchema,
  circleInviteLinkIdSchema,
} from "@/server/presentation/dto/ids";

export const circleInviteLinkDtoSchema = z.object({
  id: circleInviteLinkIdSchema,
  circleId: circleIdSchema,
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export type CircleInviteLinkDto = z.infer<typeof circleInviteLinkDtoSchema>;

export const circleInviteLinkCreateInputSchema = z.object({
  circleId: circleIdSchema,
  expiryDays: z.number().int().min(1).max(30).optional(),
});

export type CircleInviteLinkCreateInput = z.infer<
  typeof circleInviteLinkCreateInputSchema
>;

export const circleInviteLinkInfoInputSchema = z.object({
  token: z.string().trim().min(1),
});

export type CircleInviteLinkInfoInput = z.infer<
  typeof circleInviteLinkInfoInputSchema
>;

export const circleInviteLinkInfoDtoSchema = z.object({
  token: z.string(),
  circleName: z.string(),
  circleId: circleIdSchema,
  expired: z.boolean(),
});

export type CircleInviteLinkInfoDto = z.infer<
  typeof circleInviteLinkInfoDtoSchema
>;

export const circleInviteLinkRedeemInputSchema = z.object({
  token: z.string().trim().min(1),
});

export type CircleInviteLinkRedeemInput = z.infer<
  typeof circleInviteLinkRedeemInputSchema
>;

export const circleInviteLinkRedeemResultDtoSchema = z.object({
  circleId: circleIdSchema,
  alreadyMember: z.boolean(),
});

export type CircleInviteLinkRedeemResultDto = z.infer<
  typeof circleInviteLinkRedeemResultDtoSchema
>;
