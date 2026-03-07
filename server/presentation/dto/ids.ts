import { z } from "zod";
import type {
  CircleId,
  CircleInviteLinkId,
  CircleSessionId,
  InviteLinkToken,
  MatchId,
  RoundRobinScheduleId,
  UserId,
} from "@/server/domain/common/ids";
import {
  toCircleId,
  toCircleInviteLinkId,
  toCircleSessionId,
  toInviteLinkToken,
  toMatchId,
  toRoundRobinScheduleId,
  toUserId,
} from "@/server/domain/common/ids";

const idStringSchema = z.string().trim().min(1);

const makeIdSchema = <T>(
  brand: (value: string) => T,
): z.ZodType<T, z.ZodTypeDef, string> => idStringSchema.transform(brand);

export const userIdSchema = makeIdSchema<UserId>(toUserId);
export const circleIdSchema = makeIdSchema<CircleId>(toCircleId);
export const circleSessionIdSchema =
  makeIdSchema<CircleSessionId>(toCircleSessionId);
export const matchIdSchema = makeIdSchema<MatchId>(toMatchId);
export const circleInviteLinkIdSchema =
  makeIdSchema<CircleInviteLinkId>(toCircleInviteLinkId);
export const roundRobinScheduleIdSchema =
  makeIdSchema<RoundRobinScheduleId>(toRoundRobinScheduleId);

export const inviteLinkTokenSchema: z.ZodType<
  InviteLinkToken,
  z.ZodTypeDef,
  string
> = z.string().uuid().transform(toInviteLinkToken);
