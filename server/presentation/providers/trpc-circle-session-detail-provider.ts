import {
  formatDateForInput,
  formatDateTimeForInput,
  formatDateTimeRange,
} from "@/lib/date-utils";
import { CircleSessionRole } from "@/server/domain/services/authz/roles";
import { userId } from "@/server/domain/common/ids";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  CircleSessionDetailProvider,
  CircleSessionDetailProviderInput,
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

export const trpcCircleSessionDetailProvider: CircleSessionDetailProvider = {
  async getDetail(input: CircleSessionDetailProviderInput) {
    const ctx = await createContext();
    const caller = appRouter.createCaller(ctx);

    const session = await caller.circleSessions.get({
      circleSessionId: input.circleSessionId,
    });
    const circle = await caller.circles.get({ circleId: session.circleId });
    const participations = await caller.circleSessions.participations.list({
      circleSessionId: session.id,
    });
    const matches = await caller.matches.list({
      circleSessionId: session.id,
    });

    const userIds = new Set<string>();
    for (const participation of participations) {
      userIds.add(participation.userId);
    }
    for (const match of matches) {
      userIds.add(match.player1Id);
      userIds.add(match.player2Id);
    }
    const users = await ctx.userService.listUsers(
      ctx.actorId,
      Array.from(userIds).map((id) => userId(id)),
    );
    const userNameById = new Map(
      users.map((user) => [user.id as string, user.name]),
    );

    const viewerId = input.viewerId ?? ctx.actorId ?? null;
    const viewerRole = getViewerRole(participations, viewerId);
    const canCreateCircleSession = viewerId
      ? await ctx.accessService.canCreateCircleSession(
          viewerId,
          session.circleId,
        )
      : false;
    const canDeleteCircleSession = viewerId
      ? await ctx.accessService.canDeleteCircleSession(viewerId, session.id)
      : false;
    const canWithdrawFromCircleSession = viewerId
      ? await ctx.accessService.canWithdrawFromCircleSession(
          viewerId,
          session.id,
        )
      : false;

    const matchViewModels: CircleSessionMatch[] = matches
      .filter((match) => match.deletedAt == null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
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
  },
};
