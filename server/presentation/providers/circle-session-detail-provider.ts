import {
  formatDateForInput,
  formatDateTimeForInput,
  formatDateTimeRange,
} from "@/lib/date-utils";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  CircleSessionMatch,
  CircleSessionMembership,
  CircleSessionRoleKey,
  CircleSessionDetailViewModel,
} from "@/server/presentation/view-models/circle-session-detail";

const roleKeyByDto: Record<CircleSessionRole, CircleSessionRoleKey> = {
  [CircleSessionRole.CircleSessionOwner]: "owner",
  [CircleSessionRole.CircleSessionManager]: "manager",
  [CircleSessionRole.CircleSessionMember]: "member",
};

const getViewerRole = (
  memberships: Array<{ userId: string; role: CircleSessionRole }>,
  viewerId: string | null,
): CircleSessionRoleKey | null => {
  if (!viewerId) {
    return null;
  }
  const membership = memberships.find((item) => item.userId === viewerId);
  if (!membership) {
    return null;
  }
  return roleKeyByDto[membership.role] ?? null;
};

const mapMemberships = (
  memberships: Array<{ userId: string; role: CircleSessionRole }>,
  nameById: Map<string, string | null>,
  canChangeRoleById: Map<string, boolean>,
): CircleSessionMembership[] =>
  memberships.map((membership) => ({
    id: membership.userId,
    name: nameById.get(membership.userId) ?? membership.userId,
    role: roleKeyByDto[membership.role] ?? null,
    canChangeRole: canChangeRoleById.get(membership.userId) ?? false,
  }));

const mergeMembershipIds = (
  memberships: CircleSessionMembership[],
  matches: CircleSessionMatch[],
  nameById: Map<string, string | null>,
) => {
  const ids = new Set(memberships.map((membership) => membership.id));
  const extras: CircleSessionMembership[] = [];

  for (const match of matches) {
    if (!ids.has(match.player1Id)) {
      ids.add(match.player1Id);
      extras.push({
        id: match.player1Id,
        name: nameById.get(match.player1Id) ?? match.player1Id,
        role: null,
        canChangeRole: false,
      });
    }
    if (!ids.has(match.player2Id)) {
      ids.add(match.player2Id);
      extras.push({
        id: match.player2Id,
        name: nameById.get(match.player2Id) ?? match.player2Id,
        role: null,
        canChangeRole: false,
      });
    }
  }

  return memberships.concat(extras);
};

export async function getCircleSessionDetailViewModel(
  circleSessionId: string,
): Promise<CircleSessionDetailViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const session = await caller.circleSessions.get({ circleSessionId });

  const [circle, memberships, matches] = await Promise.all([
    caller.circles.get({ circleId: session.circleId }),
    caller.circleSessions.memberships.list({
      circleSessionId: session.id,
    }),
    caller.matches.list({ circleSessionId: session.id }),
  ]);

  const userIds = new Set<string>();
  for (const membership of memberships) {
    userIds.add(membership.userId);
  }
  for (const match of matches) {
    userIds.add(match.player1Id);
    userIds.add(match.player2Id);
  }

  const viewerId = ctx.actorId ?? null;

  const [
    users,
    canCreateCircleSession,
    canEditCircleSession,
    canDeleteCircleSession,
    canWithdrawFromCircleSession,
  ] = await Promise.all([
    caller.users.list({ userIds: Array.from(userIds) }),
    viewerId
      ? ctx.accessService.canCreateCircleSession(viewerId, session.circleId)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canEditCircleSession(viewerId, session.id)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canDeleteCircleSession(viewerId, session.id)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canWithdrawFromCircleSession(viewerId, session.id)
      : Promise.resolve(false),
  ]);

  const userNameById = new Map(users.map((user) => [user.id, user.name]));
  const viewerRole = getViewerRole(memberships, viewerId);

  const matchViewModels: CircleSessionMatch[] = matches
    .filter((match) => match.deletedAt == null)
    .map((match) => ({
      id: match.id,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      outcome: match.outcome,
      createdAtInput: formatDateForInput(match.createdAt),
    }));

  const canChangeRoleById = new Map<string, boolean>();
  if (viewerId) {
    const canChangeResults = await Promise.all(
      memberships.map(async (membership) => {
        const can =
          await ctx.accessService.canChangeCircleSessionMemberRole(
            viewerId,
            membership.userId,
            session.id,
          );
        return [membership.userId, can] as const;
      }),
    );
    for (const [userId, can] of canChangeResults) {
      canChangeRoleById.set(userId, can);
    }
  }

  const membershipViewModels = mergeMembershipIds(
    mapMemberships(memberships, userNameById, canChangeRoleById),
    matchViewModels,
    userNameById,
  );

  const detail: CircleSessionDetailViewModel = {
    circleSessionId: session.id,
    circleId: circle.id,
    circleName: circle.name,
    title: session.title,
    dateTimeLabel: formatDateTimeRange(session.startsAt, session.endsAt),
    locationLabel: session.location,
    memoText: session.note.trim() ? session.note : null,
    sessionDateInput: formatDateForInput(session.startsAt),
    startsAtInput: formatDateTimeForInput(session.startsAt),
    endsAtInput: formatDateTimeForInput(session.endsAt),
    viewerRole,
    canCreateCircleSession,
    canEditCircleSession,
    canDeleteCircleSession,
    canWithdrawFromCircleSession,
    memberships: membershipViewModels,
    matches: matchViewModels,
  };

  return detail;
}
