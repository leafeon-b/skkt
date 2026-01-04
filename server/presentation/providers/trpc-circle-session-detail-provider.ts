import { CircleSessionRole } from "@/server/domain/services/authz/roles";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  CircleSessionDetailProvider,
  CircleSessionDetailProviderInput,
  CircleSessionMatch,
  CircleSessionParticipant,
  CircleSessionRoleKey,
  CircleSessionDetailViewModel,
} from "@/server/presentation/view-models/circle-session-detail";

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDateForInput = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

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

const getViewerRole = (
  participants: Array<{ userId: string; role: CircleSessionRole }>,
  viewerId: string | null
): CircleSessionRoleKey | null => {
  if (!viewerId) {
    return null;
  }
  const participant = participants.find((item) => item.userId === viewerId);
  if (!participant) {
    return null;
  }
  return roleKeyByDto[participant.role] ?? null;
};

const mapParticipants = (
  participants: Array<{ userId: string }>
): CircleSessionParticipant[] =>
  participants.map((participant) => ({
    id: participant.userId,
    name: participant.userId,
  }));

const mergeParticipantIds = (
  participants: CircleSessionParticipant[],
  matches: CircleSessionMatch[]
) => {
  const ids = new Set(participants.map((participant) => participant.id));
  const extras: CircleSessionParticipant[] = [];

  for (const match of matches) {
    if (!ids.has(match.player1Id)) {
      ids.add(match.player1Id);
      extras.push({ id: match.player1Id, name: match.player1Id });
    }
    if (!ids.has(match.player2Id)) {
      ids.add(match.player2Id);
      extras.push({ id: match.player2Id, name: match.player2Id });
    }
  }

  return participants.concat(extras);
};

export const trpcCircleSessionDetailProvider: CircleSessionDetailProvider = {
  async getDetail(input: CircleSessionDetailProviderInput) {
    const ctx = await createContext();
    const caller = appRouter.createCaller(ctx);

    const session = await caller.circleSessions.get({
      circleSessionId: input.circleSessionId,
    });
    const circle = await caller.circles.get({ circleId: session.circleId });
    const participants = await caller.circleSessions.participants.list({
      circleSessionId: session.id,
    });
    const matches = await caller.matches.list({
      circleSessionId: session.id,
    });

    const viewerId = input.viewerId ?? ctx.actorId ?? null;
    const viewerRole = getViewerRole(participants, viewerId);

    const matchViewModels: CircleSessionMatch[] = matches
      .filter((match) => match.deletedAt == null)
      .sort((a, b) => a.order - b.order)
      .map((match) => ({
        id: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        outcome: match.outcome,
      }));

    const participantViewModels = mergeParticipantIds(
      mapParticipants(participants),
      matchViewModels
    );

    const detail: CircleSessionDetailViewModel = {
      circleSessionId: session.id,
      circleId: circle.id,
      circleName: circle.name,
      title: `第${session.sequence}回 研究会`,
      dateTimeLabel: formatDateTimeRange(session.startsAt, session.endsAt),
      locationLabel: session.location,
      memoText: null,
      sessionDateInput: formatDateForInput(session.startsAt),
      viewerRole,
      participants: participantViewModels,
      matches: matchViewModels,
    };

    return detail;
  },
};
