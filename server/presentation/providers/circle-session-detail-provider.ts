import {
  formatDateForInput,
  formatDateTimeForInput,
  formatDateTimeRange,
} from "@/lib/date-utils";
import { CircleSessionRole } from "@/server/domain/services/authz/roles";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  CircleSessionMatch,
  CircleSessionParticipation,
  CircleSessionRoleKey,
  CircleSessionDetailViewModel,
} from "@/server/presentation/view-models/circle-session-detail";

const roleKeyByDto: Record<CircleSessionRole, CircleSessionRoleKey> = {
  [CircleSessionRole.CircleSessionOwner]: "owner",
  [CircleSessionRole.CircleSessionManager]: "manager",
  [CircleSessionRole.CircleSessionMember]: "member",
};

const getViewerRole = (
  participations: Array<{ userId: string; role: CircleSessionRole }>,
  viewerId: string | null,
): CircleSessionRoleKey | null => {
  if (!viewerId) {
    return null;
  }
  const participation = participations.find((item) => item.userId === viewerId);
  if (!participation) {
    return null;
  }
  return roleKeyByDto[participation.role] ?? null;
};

const mapParticipations = (
  participations: Array<{ userId: string }>,
  nameById: Map<string, string | null>,
): CircleSessionParticipation[] =>
  participations.map((participation) => ({
    id: participation.userId,
    name: nameById.get(participation.userId) ?? participation.userId,
  }));

const mergeParticipationIds = (
  participations: CircleSessionParticipation[],
  matches: CircleSessionMatch[],
  nameById: Map<string, string | null>,
) => {
  const ids = new Set(participations.map((participation) => participation.id));
  const extras: CircleSessionParticipation[] = [];

  for (const match of matches) {
    if (!ids.has(match.player1Id)) {
      ids.add(match.player1Id);
      extras.push({
        id: match.player1Id,
        name: nameById.get(match.player1Id) ?? match.player1Id,
      });
    }
    if (!ids.has(match.player2Id)) {
      ids.add(match.player2Id);
      extras.push({
        id: match.player2Id,
        name: nameById.get(match.player2Id) ?? match.player2Id,
      });
    }
  }

  return participations.concat(extras);
};

export async function getCircleSessionDetailViewModel(
  circleSessionId: string,
): Promise<CircleSessionDetailViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const session = await caller.circleSessions.get({ circleSessionId });

  const [circle, participations, matches] = await Promise.all([
    caller.circles.get({ circleId: session.circleId }),
    caller.circleSessions.participations.list({
      circleSessionId: session.id,
    }),
    caller.matches.list({ circleSessionId: session.id }),
  ]);

  const userIds = new Set<string>();
  for (const participation of participations) {
    userIds.add(participation.userId);
  }
  for (const match of matches) {
    userIds.add(match.player1Id);
    userIds.add(match.player2Id);
  }

  const viewerId = ctx.actorId ?? null;

  const [
    users,
    canCreateCircleSession,
    canDeleteCircleSession,
    canWithdrawFromCircleSession,
  ] = await Promise.all([
    caller.users.list({ userIds: Array.from(userIds) }),
    viewerId
      ? ctx.accessService.canCreateCircleSession(viewerId, session.circleId)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canDeleteCircleSession(viewerId, session.id)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canWithdrawFromCircleSession(viewerId, session.id)
      : Promise.resolve(false),
  ]);

  const userNameById = new Map(users.map((user) => [user.id, user.name]));
  const viewerRole = getViewerRole(participations, viewerId);

  const matchViewModels: CircleSessionMatch[] = matches
    .filter((match) => match.deletedAt == null)
    .map((match) => ({
      id: match.id,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      outcome: match.outcome,
    }));

  const participationViewModels = mergeParticipationIds(
    mapParticipations(participations, userNameById),
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
    canDeleteCircleSession,
    canWithdrawFromCircleSession,
    participations: participationViewModels,
    matches: matchViewModels,
  };

  return detail;
}
