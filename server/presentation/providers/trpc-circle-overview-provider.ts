import { CircleRole } from "@/server/domain/services/authz/roles";
import { userId } from "@/server/domain/common/ids";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type {
  CircleOverviewAction,
  CircleOverviewPanelItem,
  CircleOverviewProvider,
  CircleOverviewProviderInput,
  CircleOverviewSession,
  CircleOverviewViewModel,
  CircleRoleKey,
} from "@/server/presentation/view-models/circle-overview";

type RoleConfig = {
  actions: CircleOverviewAction[];
  panelTitle: string;
  panelItems: CircleOverviewPanelItem[];
};

const roleKeyByDto: Record<CircleRole, CircleRoleKey> = {
  [CircleRole.CircleOwner]: "owner",
  [CircleRole.CircleManager]: "manager",
  [CircleRole.CircleMember]: "member",
};

const defaultActions: CircleOverviewAction[] = [
  {
    label: "開催日程を追加",
    className: "bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90",
  },
  {
    label: "参加者を管理",
    variant: "outline",
    className:
      "border-(--brand-moss)/30 bg-white/70 text-(--brand-ink) hover:bg-white",
  },
];

const ownerManagerBase: Pick<
  RoleConfig,
  "actions" | "panelTitle" | "panelItems"
> = {
  actions: [
    {
      label: "開催日程を追加",
      className:
        "bg-(--brand-gold) text-(--brand-ink) hover:bg-(--brand-gold)/90",
    },
    {
      label: "参加者を管理",
      variant: "outline",
      className:
        "border-(--brand-gold)/40 bg-white/70 text-(--brand-ink) hover:bg-white",
    },
  ],
  panelTitle: "運営タスク",
  panelItems: [
    { title: "参加申請の承認", meta: "承認待ち 2件", status: "要対応" },
    { title: "次期の役割設定", meta: "4月期の割り当て", status: "準備中" },
    { title: "開催場所の更新", meta: "京都キャンパス A", status: "進行中" },
  ],
};

const roleConfigs: Record<CircleRoleKey, RoleConfig> = {
  owner: { ...ownerManagerBase },
  manager: { ...ownerManagerBase },
  member: {
    actions: [
      {
        label: "参加予定を登録",
        className: "bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90",
      },
      {
        label: "参加者一覧",
        variant: "outline",
        className:
          "border-(--brand-moss)/30 bg-white/70 text-(--brand-ink) hover:bg-white",
      },
    ],
    panelTitle: "メンバーの参加メモ",
    panelItems: [
      { title: "次回の参加", meta: "出席で登録済み", status: "登録済み" },
      { title: "対局テーマ", meta: "中盤の形を研究", status: "確認中" },
      { title: "連絡事項", meta: "3/15 会場変更", status: "お知らせ" },
    ],
  },
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;

const formatTime = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatDateTimeRange = (startsAt: Date, endsAt: Date) =>
  `${formatDate(startsAt)} ${formatTime(startsAt)} - ${formatTime(endsAt)}`;

const getSessionStatus = (startsAt: Date, endsAt: Date) => {
  const now = new Date();
  if (endsAt < now) {
    return "done";
  }
  if (startsAt > now) {
    return "scheduled";
  }
  return "scheduled";
};

const buildSessionTitle = (sequence: number) => `第${sequence}回 研究会`;

const toSessionViewModel = (session: {
  id: string;
  sequence: number;
  startsAt: Date;
  endsAt: Date;
}): CircleOverviewSession => ({
  id: session.id,
  title: buildSessionTitle(session.sequence),
  dateLabel: formatDate(session.startsAt),
  status: getSessionStatus(session.startsAt, session.endsAt),
});

const getViewerRole = (
  participants: Array<{ userId: string; role: CircleRole }>,
  viewerId: string | null,
): CircleRoleKey | null => {
  if (!viewerId) {
    return null;
  }
  const participant = participants.find((item) => item.userId === viewerId);
  if (!participant) {
    return null;
  }
  return roleKeyByDto[participant.role] ?? null;
};

export const trpcCircleOverviewProvider: CircleOverviewProvider = {
  async getOverview(input: CircleOverviewProviderInput) {
    const ctx = await createContext();
    const caller = appRouter.createCaller(ctx);

    const [circle, participants, sessions] = await Promise.all([
      caller.circles.get({ circleId: input.circleId }),
      caller.circles.participants.list({ circleId: input.circleId }),
      caller.circleSessions.list({ circleId: input.circleId }),
    ]);

    const users = await ctx.userService.listUsers(
      ctx.actorId,
      participants.map((participant) => userId(participant.userId)),
    );
    const userNameById = new Map(
      users.map((user) => [user.id as string, user.name]),
    );

    const viewerId = input.viewerId ?? ctx.actorId ?? null;
    const viewerRole =
      input.viewerRoleOverride ?? getViewerRole(participants, viewerId);

    const recentSessions = [...sessions]
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
      .slice(0, 3)
      .map(toSessionViewModel);

    const upcomingSessions = sessions
      .filter((session) => session.startsAt >= new Date())
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const nextSession = upcomingSessions[0];

    const overview: CircleOverviewViewModel = {
      circleId: circle.id,
      circleName: circle.name,
      participantCount: participants.length,
      scheduleNote: null,
      nextSession: nextSession
        ? {
            id: nextSession.id,
            dateTimeLabel: formatDateTimeRange(
              nextSession.startsAt,
              nextSession.endsAt,
            ),
            locationLabel: nextSession.location,
          }
        : null,
      viewerRole,
      actions: viewerRole ? roleConfigs[viewerRole].actions : defaultActions,
      rolePanel: viewerRole
        ? {
            title: roleConfigs[viewerRole].panelTitle,
            items: roleConfigs[viewerRole].panelItems,
          }
        : null,
      recentSessions,
      members: participants.map((participant) => ({
        userId: participant.userId,
        name: userNameById.get(participant.userId) ?? participant.userId,
        role: roleKeyByDto[participant.role] ?? "member",
      })),
    };

    return overview;
  },
};
