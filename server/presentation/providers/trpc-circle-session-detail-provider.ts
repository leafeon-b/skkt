import {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";
import { userId } from "@/server/domain/common/ids";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  CircleRoleKey,
  CircleSessionDetailProvider,
  CircleSessionDetailProviderInput,
  CircleSessionMatch,
  CircleSessionParticipation,
  CircleSessionRoleKey,
  CircleSessionDetailViewModel,
} from "@/server/presentation/view-models/circle-session-detail";

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDateForInput = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatDateTimeForInput = (date: Date) =>
  `${formatDateForInput(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;

const formatTime = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatDateTimeRange = (startsAt: Date, endsAt: Date) =>
  `${formatDate(startsAt)} ${formatTime(startsAt)} - ${formatTime(endsAt)}`;

const roleKeyByDto: Record<CircleSessionRole, CircleSessionRoleKey> = {
  [CircleSessionRole.CircleSessionOwner]: "owner",
  [CircleSessionRole.CircleSessionManager]: "manager",
  [CircleSessionRole.CircleSessionMember]: "member",
};

const circleRoleKeyByDto: Record<CircleRole, CircleRoleKey> = {
  [CircleRole.CircleOwner]: "owner",
  [CircleRole.CircleManager]: "manager",
  [CircleRole.CircleMember]: "member",
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

    const circleParticipations = await caller.circles.participations.list({
      circleId: session.circleId,
    });

    const viewerId = input.viewerId ?? ctx.actorId ?? null;
    const viewerRole = getViewerRole(participations, viewerId);
    const viewerCircleParticipation = viewerId
      ? circleParticipations.find((p) => p.userId === viewerId)
      : null;
    const viewerCircleRole = viewerCircleParticipation
      ? (circleRoleKeyByDto[viewerCircleParticipation.role] ?? null)
      : null;

    const matchViewModels: CircleSessionMatch[] = matches
      .filter((match) => match.deletedAt == null)
      .sort((a, b) => a.order - b.order)
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
      title: session.title?.trim()
        ? session.title
        : `第${session.sequence}回 研究会`,
      dateTimeLabel: formatDateTimeRange(session.startsAt, session.endsAt),
      locationLabel: session.location,
      memoText: session.note.trim() ? session.note : null,
      sessionDateInput: formatDateForInput(session.startsAt),
      startsAtInput: formatDateTimeForInput(session.startsAt),
      endsAtInput: formatDateTimeForInput(session.endsAt),
      viewerRole,
      viewerCircleRole,
      participations: participationViewModels,
      matches: matchViewModels,
    };

    return detail;
  },
};
