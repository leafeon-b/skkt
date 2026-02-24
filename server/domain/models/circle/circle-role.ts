export const CircleRole = {
  CircleOwner: "CircleOwner",
  CircleManager: "CircleManager",
  CircleMember: "CircleMember",
} as const;

export type CircleRole = (typeof CircleRole)[keyof typeof CircleRole];

const CIRCLE_ROLE_ORDER: readonly CircleRole[] = [
  CircleRole.CircleOwner,
  CircleRole.CircleManager,
  CircleRole.CircleMember,
] as const;

function roleRank(role: CircleRole, order: readonly CircleRole[]): number {
  return order.indexOf(role);
}

/**
 * actorRole が targetRole と同等以上（上位を含む）なら true。
 */
export function isSameOrHigherCircleRole(
  actorRole: CircleRole,
  targetRole: CircleRole,
): boolean {
  return (
    roleRank(actorRole, CIRCLE_ROLE_ORDER) <=
    roleRank(targetRole, CIRCLE_ROLE_ORDER)
  );
}
