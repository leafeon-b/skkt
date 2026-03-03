import { z } from "zod";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";

const circleRoleValues = [
  CircleRole.CircleOwner,
  CircleRole.CircleManager,
  CircleRole.CircleMember,
] as const;

export const circleRoleSchema = z.enum(circleRoleValues);
export type CircleRoleDto = z.infer<typeof circleRoleSchema>;

const assignableCircleRoleValues = [
  CircleRole.CircleManager,
  CircleRole.CircleMember,
] as const;

export const assignableCircleRoleSchema = z.enum(assignableCircleRoleValues);

const assignableCircleSessionRoleValues = [
  CircleSessionRole.CircleSessionManager,
  CircleSessionRole.CircleSessionMember,
] as const;

export const assignableCircleSessionRoleSchema = z.enum(
  assignableCircleSessionRoleValues,
);

const circleSessionRoleValues = [
  CircleSessionRole.CircleSessionOwner,
  CircleSessionRole.CircleSessionManager,
  CircleSessionRole.CircleSessionMember,
] as const;

export const circleSessionRoleSchema = z.enum(circleSessionRoleValues);
export type CircleSessionRoleDto = z.infer<typeof circleSessionRoleSchema>;
