import type {
  CircleRole as PrismaCircleRole,
  CircleSessionRole as PrismaCircleSessionRole,
} from "@/generated/prisma/enums";
import type {
  CircleMembershipStatus,
  CircleSessionMembershipStatus,
} from "@/server/domain/services/authz/memberships";
import {
  circleMembershipStatusFromRole,
  circleSessionMembershipStatusFromRole,
} from "@/server/domain/services/authz/memberships";
import type {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";

export const mapCircleRoleToDomain = (role: PrismaCircleRole): CircleRole =>
  role;

export const mapCircleSessionRoleToDomain = (
  role: PrismaCircleSessionRole,
): CircleSessionRole => role;

export const mapCircleMembershipFromPersistence = (
  role: PrismaCircleRole | null,
): CircleMembershipStatus =>
  circleMembershipStatusFromRole(role ? mapCircleRoleToDomain(role) : null);

export const mapCircleSessionMembershipFromPersistence = (
  role: PrismaCircleSessionRole | null,
): CircleSessionMembershipStatus =>
  circleSessionMembershipStatusFromRole(
    role ? mapCircleSessionRoleToDomain(role) : null,
  );
