export const CircleSessionRole = {
  CircleSessionOwner: "CircleSessionOwner",
  CircleSessionManager: "CircleSessionManager",
  CircleSessionMember: "CircleSessionMember",
} as const;

export type CircleSessionRole =
  (typeof CircleSessionRole)[keyof typeof CircleSessionRole];

const CIRCLE_SESSION_ROLE_ORDER: readonly CircleSessionRole[] = [
  CircleSessionRole.CircleSessionOwner,
  CircleSessionRole.CircleSessionManager,
  CircleSessionRole.CircleSessionMember,
] as const;

function roleRank(
  role: CircleSessionRole,
  order: readonly CircleSessionRole[],
): number {
  return order.indexOf(role);
}

/**
 * actorRole が targetRole と同等以上（上位を含む）なら true。
 */
export function isSameOrHigherCircleSessionRole(
  actorRole: CircleSessionRole,
  targetRole: CircleSessionRole,
): boolean {
  return (
    roleRank(actorRole, CIRCLE_SESSION_ROLE_ORDER) <=
    roleRank(targetRole, CIRCLE_SESSION_ROLE_ORDER)
  );
}
