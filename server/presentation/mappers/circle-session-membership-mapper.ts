import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import {
  circleSessionMembershipDtoSchema,
  type CircleSessionMembershipDto,
} from "@/server/presentation/dto/circle-session-membership";

export const toCircleSessionMembershipDto = (
  membership: CircleSessionMembership,
): CircleSessionMembershipDto =>
  circleSessionMembershipDtoSchema.parse(membership);

export const toCircleSessionMembershipDtos = (
  memberships: CircleSessionMembership[],
): CircleSessionMembershipDto[] =>
  memberships.map(toCircleSessionMembershipDto);
