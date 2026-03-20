import {
  formatDateForInput,
  formatDateTimeForInput,
  formatDateTimeRange,
} from "@/lib/date-utils";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import {
  toCircleSessionId as toCircleSessionId,
  type CircleSessionId,
  type UserId,
} from "@/server/domain/common/ids";
import { UNKNOWN_USER_NAME } from "@/server/presentation/constants";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  AddableMemberCandidate,
  CircleSessionMatch,
  CircleSessionMembership,
  CircleSessionRoleKey,
  CircleSessionDetailViewModel,
  RoundRobinScheduleViewModel,
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
  canRemoveById: Map<string, boolean>,
): CircleSessionMembership[] =>
  memberships.map((membership) => ({
    id: membership.userId,
    name: nameById.get(membership.userId) ?? UNKNOWN_USER_NAME,
    role: roleKeyByDto[membership.role] ?? null,
    canChangeRole: canChangeRoleById.get(membership.userId) ?? false,
    canRemoveMember: canRemoveById.get(membership.userId) ?? false,
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
        name: nameById.get(match.player1Id) ?? UNKNOWN_USER_NAME,
        role: null,
        canChangeRole: false,
        canRemoveMember: false,
      });
    }
    if (!ids.has(match.player2Id)) {
      ids.add(match.player2Id);
      extras.push({
        id: match.player2Id,
        name: nameById.get(match.player2Id) ?? UNKNOWN_USER_NAME,
        role: null,
        canChangeRole: false,
        canRemoveMember: false,
      });
    }
  }

  return memberships.concat(extras);
};

const mapMatches = (
  matches: Array<{
    id: string;
    player1Id: string;
    player2Id: string;
    outcome: CircleSessionMatch["outcome"];
    createdAt: Date;
    deletedAt: Date | null;
  }>,
): CircleSessionMatch[] =>
  matches
    .filter((match) => match.deletedAt == null)
    .map((match) => ({
      id: match.id,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      outcome: match.outcome,
      createdAtInput: formatDateForInput(match.createdAt),
    }));

const buildCanChangeRoleMap = async (
  viewerId: string | null,
  memberships: Array<{ userId: string }>,
  accessService: {
    canChangeCircleSessionMemberRole: (
      actorId: string,
      targetUserId: string,
      sessionId: string,
    ) => Promise<boolean>;
  },
  sessionId: string,
): Promise<Map<string, boolean>> => {
  const canChangeRoleById = new Map<string, boolean>();
  if (viewerId) {
    const canChangeResults = await Promise.all(
      memberships.map(async (membership) => {
        const can = await accessService.canChangeCircleSessionMemberRole(
          viewerId,
          membership.userId,
          sessionId,
        );
        return [membership.userId, can] as const;
      }),
    );
    for (const [userId, can] of canChangeResults) {
      canChangeRoleById.set(userId, can);
    }
  }
  return canChangeRoleById;
};

const buildCanRemoveMap = (
  canRemoveCircleSessionMember: boolean,
  viewerId: string | null,
  memberships: Array<{ userId: string; role: CircleSessionRole }>,
): Map<string, boolean> => {
  const canRemoveById = new Map<string, boolean>();
  if (canRemoveCircleSessionMember && viewerId) {
    for (const membership of memberships) {
      const roleKey = roleKeyByDto[membership.role];
      const isSelf = membership.userId === viewerId;
      canRemoveById.set(membership.userId, roleKey !== "owner" && !isSelf);
    }
  }
  return canRemoveById;
};

const mapRoundRobinSchedule = (
  roundRobinScheduleDto: {
    id: string;
    rounds: Array<{
      roundNumber: number;
      pairings: Array<{
        player1: { id: string; name: string | null };
        player2: { id: string; name: string | null };
      }>;
    }>;
    totalMatchCount: number;
  } | null,
): RoundRobinScheduleViewModel | null =>
  roundRobinScheduleDto
    ? {
        id: roundRobinScheduleDto.id,
        rounds: roundRobinScheduleDto.rounds.map((round) => ({
          roundNumber: round.roundNumber,
          pairings: round.pairings.map((pairing) => ({
            player1: {
              id: pairing.player1.id,
              name: pairing.player1.name ?? UNKNOWN_USER_NAME,
            },
            player2: {
              id: pairing.player2.id,
              name: pairing.player2.name ?? UNKNOWN_USER_NAME,
            },
          })),
        })),
        totalMatchCount: roundRobinScheduleDto.totalMatchCount,
      }
    : null;

const fetchAddableMemberCandidates = async (
  canAddCircleSessionMember: boolean,
  caller: ReturnType<typeof appRouter.createCaller>,
  session: { id: string; circleId: string },
  memberships: Array<{ userId: string }>,
  userNameById: ReadonlyMap<string, string | null>,
  circleSessionMembershipService: {
    listDeletedMemberships: (
      sessionId: CircleSessionId,
    ) => Promise<Array<{ userId: UserId }>>;
  },
): Promise<{
  candidates: AddableMemberCandidate[];
  newNames: ReadonlyMap<UserId, string | null>;
}> => {
  if (!canAddCircleSessionMember) {
    return { candidates: [], newNames: new Map() };
  }

  const [circleMembers, deletedMemberships] = await Promise.all([
    caller.circles.memberships.list({
      circleId: session.circleId,
    }),
    circleSessionMembershipService.listDeletedMemberships(
      toCircleSessionId(session.id),
    ),
  ]);
  const sessionMemberIds = new Set(memberships.map((m) => m.userId));
  const candidateUserIds = new Set(
    circleMembers
      .filter((cm) => !sessionMemberIds.has(cm.userId))
      .map((cm) => cm.userId),
  );
  for (const dm of deletedMemberships) {
    if (!sessionMemberIds.has(dm.userId)) {
      candidateUserIds.add(dm.userId);
    }
  }

  const candidateUserIdArray = Array.from(candidateUserIds);
  if (candidateUserIdArray.length === 0) {
    return { candidates: [], newNames: new Map() };
  }

  const newNames = new Map<UserId, string | null>();
  const candidateUserIdsToResolve = candidateUserIdArray.filter(
    (id) => !userNameById.has(id),
  );
  if (candidateUserIdsToResolve.length > 0) {
    const extraUsers = await caller.users.list({
      userIds: candidateUserIdsToResolve,
    });
    for (const user of extraUsers) {
      newNames.set(user.id, user.name);
    }
  }

  const candidates = candidateUserIdArray.map((id) => ({
    id,
    name: userNameById.get(id) ?? newNames.get(id) ?? UNKNOWN_USER_NAME,
  }));

  return { candidates, newNames };
};

export async function getCircleSessionDetailViewModel(
  circleSessionId: string,
): Promise<CircleSessionDetailViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const session = await caller.circleSessions.get({ circleSessionId });

  const [memberships, matches, roundRobinScheduleDto] = await Promise.all([
    caller.circleSessions.memberships.list({
      circleSessionId: session.id,
    }),
    caller.matches.list({ circleSessionId: session.id }),
    caller.roundRobinSchedules.get({
      circleId: session.circleId,
      circleSessionId: session.id,
    }),
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
    canAddCircleSessionMember,
    canRemoveCircleSessionMember,
    canTransferOwnership,
    canManageRoundRobinSchedule,
    canViewCircle,
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
    viewerId
      ? ctx.accessService.canAddCircleSessionMember(viewerId, session.id)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canRemoveCircleSessionMember(viewerId, session.id)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canTransferCircleSessionOwnership(
          viewerId,
          session.id,
        )
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canManageRoundRobinSchedule(viewerId, session.id)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canViewCircle(viewerId, session.circleId)
      : Promise.resolve(false),
  ]);

  const userNameById = new Map(users.map((user) => [user.id, user.name]));
  const viewerRole = getViewerRole(memberships, viewerId);

  const { candidates: addableMemberCandidates, newNames } =
    await fetchAddableMemberCandidates(
      canAddCircleSessionMember && canViewCircle,
      caller,
      session,
      memberships,
      userNameById,
      ctx.circleSessionMembershipService,
    );
  for (const [id, name] of newNames) {
    userNameById.set(id, name);
  }

  const matchViewModels = mapMatches(matches);

  const canChangeRoleById = await buildCanChangeRoleMap(
    viewerId,
    memberships,
    ctx.accessService,
    session.id,
  );

  const canRemoveById = buildCanRemoveMap(
    canRemoveCircleSessionMember,
    viewerId,
    memberships,
  );

  const rolePriority: Record<string, number> = {
    owner: 0,
    manager: 1,
    member: 2,
  };

  const membershipViewModels = mergeMembershipIds(
    mapMemberships(memberships, userNameById, canChangeRoleById, canRemoveById),
    matchViewModels,
    userNameById,
  ).sort(
    (a, b) =>
      (rolePriority[a.role ?? ""] ?? 3) -
      (rolePriority[b.role ?? ""] ?? 3),
  );

  const roundRobinSchedule = mapRoundRobinSchedule(roundRobinScheduleDto);

  const detail: CircleSessionDetailViewModel = {
    circleSessionId: session.id,
    circleId: session.circleId,
    title: session.title,
    dateTimeLabel: formatDateTimeRange(session.startsAt, session.endsAt),
    locationLabel: session.location,
    memoText: session.note.trim() ? session.note : null,
    sessionDateInput: formatDateForInput(session.startsAt),
    startsAtInput: formatDateTimeForInput(session.startsAt),
    endsAtInput: formatDateTimeForInput(session.endsAt),
    viewerRole,
    viewerUserId: viewerId,
    canCreateCircleSession,
    canEditCircleSession,
    canDeleteCircleSession,
    canWithdrawFromCircleSession,
    canAddCircleSessionMember,
    canTransferOwnership,
    canManageRoundRobinSchedule,
    addableMemberCandidates,
    memberships: membershipViewModels,
    matches: matchViewModels,
    roundRobinSchedule,
  };

  return detail;
}
