import type {
  CircleMembershipStatus,
  CircleSessionMembershipStatus,
} from "@/server/domain/services/authz/memberships";

export type AuthzRepository = {
  isRegisteredUser(userId: string): Promise<boolean>;
  findCircleMembership(
    userId: string,
    circleId: string,
  ): Promise<CircleMembershipStatus>;
  findCircleSessionMembership(
    userId: string,
    circleSessionId: string,
  ): Promise<CircleSessionMembershipStatus>;
};
