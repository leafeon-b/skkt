import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { NotFoundError } from "@/server/domain/common/errors";
import { UNKNOWN_USER_NAME } from "@/server/presentation/constants";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type { CircleRoleKey } from "@/server/presentation/view-models/circle-overview";
import type { CircleSettingsViewModel } from "@/server/presentation/view-models/circle-settings";

const roleKeyByDto: Record<CircleRole, CircleRoleKey> = {
  [CircleRole.CircleOwner]: "owner",
  [CircleRole.CircleManager]: "manager",
  [CircleRole.CircleMember]: "member",
};

export async function getCircleSettingsViewModel(
  circleId: string,
): Promise<CircleSettingsViewModel | null> {
  const ctx = await createContext();
  const viewerId = ctx.actorId ?? null;

  if (!viewerId) {
    return null;
  }

  const canAccess = await ctx.accessService.canDeleteCircle(
    viewerId,
    circleId,
  );
  if (!canAccess) {
    return null;
  }

  const caller = appRouter.createCaller(ctx);

  const [circle, memberships] = await Promise.all([
    caller.circles.get({ circleId }),
    caller.circles.memberships.list({ circleId }),
  ]);

  if (!circle) {
    throw new NotFoundError("Circle");
  }

  const users = await caller.users.list({
    userIds: memberships.map((m) => m.userId),
  });
  const userNameById = new Map(users.map((user) => [user.id, user.name]));

  const rolePriority: Record<CircleRoleKey, number> = {
    owner: 0,
    manager: 1,
    member: 2,
  };

  const members = memberships
    .map((membership) => ({
      userId: membership.userId,
      name: userNameById.get(membership.userId) ?? UNKNOWN_USER_NAME,
      role: (roleKeyByDto[membership.role] ?? "member") as CircleRoleKey,
      canChangeRole: false,
      canRemoveMember: false,
    }))
    .sort((a, b) => rolePriority[a.role] - rolePriority[b.role]);

  return {
    circleId: circle.id,
    circleName: circle.name,
    sessionEmailNotificationEnabled: circle.sessionEmailNotificationEnabled,
    viewerUserId: viewerId,
    members,
  };
}
