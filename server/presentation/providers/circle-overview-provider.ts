import { CircleRole } from "@/server/domain/services/authz/roles";
import { circleId, userId } from "@/server/domain/common/ids";
import type { ServiceContainer } from "@/server/application/service-container";
import type {
  CircleOverviewProvider,
  CircleOverviewProviderInput,
  CircleOverviewViewModel,
  CircleRoleKey,
} from "@/server/presentation/view-models/circle-overview";
import { NotFoundError } from "@/server/domain/common/errors";

const roleKeyByDto: Record<CircleRole, CircleRoleKey> = {
  [CircleRole.CircleOwner]: "owner",
  [CircleRole.CircleManager]: "manager",
  [CircleRole.CircleMember]: "member",
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;

const formatTime = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatDateTimeRange = (startsAt: Date, endsAt: Date) =>
  `${formatDate(startsAt)} ${formatTime(startsAt)} - ${formatTime(endsAt)}`;

const buildSessionTitle = (sequence: number) => `第${sequence}回 研究会`;

const toSessionViewModel = (session: {
  id: string;
  sequence: number;
  title: string;
  startsAt: Date;
  endsAt: Date;
}) => ({
  id: session.id,
  title: session.title?.trim()
    ? session.title
    : buildSessionTitle(session.sequence),
  startsAt: session.startsAt.toISOString(),
  endsAt: session.endsAt.toISOString(),
});

const getViewerRole = (
  participations: Array<{ userId: string; role: CircleRole }>,
  viewerId: string | null,
): CircleRoleKey | null => {
  if (!viewerId) {
    return null;
  }
  const participation = participations.find((item) => item.userId === viewerId);
  if (!participation) {
    return null;
  }
  return roleKeyByDto[participation.role] ?? null;
};

export type CircleOverviewProviderDeps = {
  circleService: ServiceContainer["circleService"];
  circleParticipationService: ServiceContainer["circleParticipationService"];
  circleSessionService: ServiceContainer["circleSessionService"];
  userService: ServiceContainer["userService"];
  getActorId: () => Promise<string | null>;
};

export const createCircleOverviewProvider = (
  deps: CircleOverviewProviderDeps,
): CircleOverviewProvider => ({
  async getOverview(input: CircleOverviewProviderInput) {
    const actorId = await deps.getActorId();

    const [circle, participations, sessions] = await Promise.all([
      deps.circleService.getCircle(actorId ?? "", circleId(input.circleId)),
      deps.circleParticipationService.listByCircleId({
        actorId: actorId ?? "",
        circleId: circleId(input.circleId),
      }),
      deps.circleSessionService.listByCircleId(
        actorId ?? "",
        circleId(input.circleId),
      ),
    ]);

    if (!circle) {
      throw new NotFoundError("Circle");
    }

    const users = await deps.userService.listUsers(
      actorId ?? "",
      participations.map((participation) => userId(participation.userId)),
    );
    const userNameById = new Map(
      users.map((user) => [user.id as string, user.name]),
    );

    const viewerId = input.viewerId ?? actorId ?? null;
    const viewerRole = getViewerRole(
      participations.map((p) => ({
        userId: p.userId as string,
        role: p.role,
      })),
      viewerId,
    );

    const allSessions = sessions
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
      .map((session) =>
        toSessionViewModel({
          id: session.id as string,
          sequence: session.sequence,
          title: session.title,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
        }),
      );

    const now = new Date();
    const upcomingSessions = sessions
      .filter((session) => session.startsAt >= now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const nextSession = upcomingSessions[0];

    const overview: CircleOverviewViewModel = {
      circleId: circle.id as string,
      circleName: circle.name,
      participationCount: participations.length,
      scheduleNote: null,
      nextSession: nextSession
        ? {
            id: nextSession.id as string,
            title: nextSession.title?.trim()
              ? nextSession.title
              : buildSessionTitle(nextSession.sequence),
            dateTimeLabel: formatDateTimeRange(
              nextSession.startsAt,
              nextSession.endsAt,
            ),
            locationLabel: nextSession.location,
          }
        : null,
      viewerRole,
      sessions: allSessions,
      members: participations.map((participation) => ({
        userId: participation.userId as string,
        name:
          userNameById.get(participation.userId as string) ??
          (participation.userId as string),
        role: roleKeyByDto[participation.role] ?? "member",
      })),
    };

    return overview;
  },
});
