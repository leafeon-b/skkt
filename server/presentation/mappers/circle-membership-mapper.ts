import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import {
  circleMembershipDtoSchema,
  type CircleMembershipDto,
} from "@/server/presentation/dto/circle-membership";

export const toCircleMembershipDto = (
  membership: CircleMembership,
): CircleMembershipDto => circleMembershipDtoSchema.parse(membership);

export const toCircleMembershipDtos = (
  memberships: CircleMembership[],
): CircleMembershipDto[] => memberships.map(toCircleMembershipDto);
