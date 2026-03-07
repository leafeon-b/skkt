import { formatDateTimeRange } from "@/lib/date-utils";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { NotFoundError } from "@/server/domain/common/errors";
import { UNKNOWN_USER_NAME } from "@/server/presentation/constants";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  CircleOverviewViewModel,
  CircleRoleKey,
} from "@/server/presentation/view-models/circle-overview";

const roleKeyByDto: Record<CircleRole, CircleRoleKey> = {
  [CircleRole.CircleOwner]: "owner",
  [CircleRole.CircleManager]: "manager",
  [CircleRole.CircleMember]: "member",
};

const toSessionViewModel = (session: {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
}) => ({
  id: session.id,
  title: session.title,
  startsAt: session.startsAt.toISOString(),
  endsAt: session.endsAt.toISOString(),
});

const getViewerRole = (
  memberships: Array<{ userId: string; role: CircleRole }>,
  viewerId: string | null,
): CircleRoleKey | null => {
  if (!viewerId) {
    return null;
  }
  const membership = memberships.find((item) => item.userId === viewerId);
  if (!membership) {
    return null;
  }
  return roleKeyByDto[membership.role] ?? null;
};

export async function getCircleOverviewViewModel(
  circleId: string,
): Promise<CircleOverviewViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const [circle, memberships, sessions] = await Promise.all([
    caller.circles.get({ circleId }),
    caller.circles.memberships.list({ circleId }),
    caller.circleSessions.list({ circleId }),
  ]);

  if (!circle) {
    throw new NotFoundError("Circle");
  }

  const viewerId = ctx.actorId ?? null;

  const [users, canRenameCircle, canRemoveCircleMember] = await Promise.all([
    caller.users.list({
      userIds: memberships.map((m) => m.userId),
    }),
    viewerId
      ? ctx.accessService.canEditCircle(viewerId, circleId)
      : Promise.resolve(false),
    viewerId
      ? ctx.accessService.canRemoveCircleMember(viewerId, circleId)
      : Promise.resolve(false),
  ]);
  const userNameById = new Map(users.map((user) => [user.id, user.name]));

  const canChangeRoleByUserId = new Map<string, boolean>();
  if (viewerId) {
    const results = await Promise.all(
      memberships.map((m) =>
        ctx.accessService.canChangeCircleMemberRole(
          viewerId,
          m.userId,
          circleId,
        ),
      ),
    );
    memberships.forEach((m, i) => {
      canChangeRoleByUserId.set(m.userId, results[i]);
    });
  }

  const viewerRole = getViewerRole(memberships, viewerId);

  const allSessions = sessions
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .map((session) => toSessionViewModel(session));

  const now = new Date();
  const upcomingSessions = sessions
    .filter((session) => session.startsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const nextSession = upcomingSessions[0];

  const rolePriority: Record<CircleRoleKey, number> = {
    owner: 0,
    manager: 1,
    member: 2,
  };

  const members = memberships
    .map((membership) => ({
      userId: membership.userId,
      name: userNameById.get(membership.userId) ?? UNKNOWN_USER_NAME,
      role: roleKeyByDto[membership.role] ?? "member",
      canChangeRole: canChangeRoleByUserId.get(membership.userId) ?? false,
      canRemoveMember:
        canRemoveCircleMember &&
        roleKeyByDto[membership.role] !== "owner" &&
        membership.userId !== viewerId,
    }))
    .sort((a, b) => rolePriority[a.role] - rolePriority[b.role]);

  const overview: CircleOverviewViewModel = {
    circleId: circle.id,
    circleName: circle.name,
    membershipCount: memberships.length,
    scheduleNote: null,
    nextSession: nextSession
      ? {
          id: nextSession.id,
          title: nextSession.title,
          dateTimeLabel: formatDateTimeRange(
            nextSession.startsAt,
            nextSession.endsAt,
          ),
          locationLabel: nextSession.location,
        }
      : null,
    viewerRole,
    sessions: allSessions,
    members,
    holidayDates: ctx.holidayProvider.getHolidayDateStringsForRange(),
    canRenameCircle,
  };

  return overview;
}
