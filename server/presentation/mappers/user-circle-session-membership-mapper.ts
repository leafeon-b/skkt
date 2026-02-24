import type { UserCircleSessionMembershipSummary } from "@/server/application/circle-session/circle-session-membership-service";
import {
  userCircleSessionMembershipSummaryDtoSchema,
  type UserCircleSessionMembershipSummaryDto,
} from "@/server/presentation/dto/user-circle-session-membership";

export const toUserCircleSessionMembershipSummaryDto = (
  summary: UserCircleSessionMembershipSummary,
): UserCircleSessionMembershipSummaryDto =>
  userCircleSessionMembershipSummaryDtoSchema.parse(summary);

export const toUserCircleSessionMembershipSummaryDtos = (
  summaries: UserCircleSessionMembershipSummary[],
): UserCircleSessionMembershipSummaryDto[] =>
  summaries.map(toUserCircleSessionMembershipSummaryDto);
