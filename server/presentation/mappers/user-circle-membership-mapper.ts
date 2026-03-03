import type { UserCircleMembership } from "@/server/application/circle/circle-membership-service";
import {
  userCircleMembershipDtoSchema,
  type UserCircleMembershipDto,
} from "@/server/presentation/dto/user-circle-membership";

export const toUserCircleMembershipDto = (
  membership: UserCircleMembership,
): UserCircleMembershipDto => userCircleMembershipDtoSchema.parse(membership);

export const toUserCircleMembershipDtos = (
  memberships: UserCircleMembership[],
): UserCircleMembershipDto[] => memberships.map(toUserCircleMembershipDto);
