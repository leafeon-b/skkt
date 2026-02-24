import type {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";

export type CircleMembershipStatus =
  | { kind: "none" }
  | { kind: "member"; role: CircleRole };

export type CircleSessionMembershipStatus =
  | { kind: "none" }
  | { kind: "member"; role: CircleSessionRole };

export const circleMembershipStatus = (
  role: CircleRole,
): CircleMembershipStatus => ({
  kind: "member",
  role,
});

export const noCircleMembershipStatus = (): CircleMembershipStatus => ({
  kind: "none",
});

export const circleMembershipStatusFromRole = (
  role: CircleRole | null,
): CircleMembershipStatus =>
  role ? circleMembershipStatus(role) : noCircleMembershipStatus();

export const isCircleMemberStatus = (
  membership: CircleMembershipStatus,
): membership is { kind: "member"; role: CircleRole } =>
  membership.kind === "member";

export const circleSessionMembershipStatus = (
  role: CircleSessionRole,
): CircleSessionMembershipStatus => ({
  kind: "member",
  role,
});

export const noCircleSessionMembershipStatus =
  (): CircleSessionMembershipStatus => ({
    kind: "none",
  });

export const circleSessionMembershipStatusFromRole = (
  role: CircleSessionRole | null,
): CircleSessionMembershipStatus =>
  role
    ? circleSessionMembershipStatus(role)
    : noCircleSessionMembershipStatus();

export const isCircleSessionMemberStatus = (
  membership: CircleSessionMembershipStatus,
): membership is { kind: "member"; role: CircleSessionRole } =>
  membership.kind === "member";
