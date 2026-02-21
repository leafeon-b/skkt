import { z } from "zod";
import type {
  CircleId,
  CircleInviteLinkId,
  CircleSessionId,
  InviteLinkToken,
  MatchHistoryId,
  MatchId,
  UserId,
} from "@/server/domain/common/ids";
import {
  circleId,
  circleInviteLinkId,
  circleSessionId,
  inviteLinkToken,
  matchHistoryId,
  matchId,
  userId,
} from "@/server/domain/common/ids";

const idStringSchema = z.string().trim().min(1);

const makeIdSchema = <T>(
  brand: (value: string) => T,
): z.ZodType<T, z.ZodTypeDef, string> => idStringSchema.transform(brand);

export const userIdSchema = makeIdSchema<UserId>(userId);
export const circleIdSchema = makeIdSchema<CircleId>(circleId);
export const circleSessionIdSchema =
  makeIdSchema<CircleSessionId>(circleSessionId);
export const matchIdSchema = makeIdSchema<MatchId>(matchId);
export const matchHistoryIdSchema =
  makeIdSchema<MatchHistoryId>(matchHistoryId);
export const circleInviteLinkIdSchema =
  makeIdSchema<CircleInviteLinkId>(circleInviteLinkId);

export const inviteLinkTokenSchema: z.ZodType<
  InviteLinkToken,
  z.ZodTypeDef,
  string
> = z.string().uuid().transform(inviteLinkToken);
