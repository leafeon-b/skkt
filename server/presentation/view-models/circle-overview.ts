export type CircleRoleKey = "owner" | "manager" | "member";
export type CircleSessionStatus = "scheduled" | "done" | "draft";

export type CircleOverviewAction = {
  label: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  className?: string;
  href?: string;
};

export type CircleOverviewPanelItem = {
  title: string;
  meta: string;
  status: string;
};

export type CircleOverviewSession = {
  id: string | null;
  title: string;
  dateLabel: string;
  status: CircleSessionStatus;
};

export type CircleOverviewMember = {
  userId: string;
  name: string;
  role: CircleRoleKey;
};

export type CircleOverviewViewModel = {
  circleId: string;
  circleName: string;
  participantCount: number;
  scheduleNote: string | null;
  nextSession: {
    id: string | null;
    dateTimeLabel: string;
    locationLabel: string | null;
  } | null;
  viewerRole: CircleRoleKey | null;
  actions: CircleOverviewAction[];
  rolePanel: {
    title: string;
    items: CircleOverviewPanelItem[];
  } | null;
  recentSessions: CircleOverviewSession[];
  members: CircleOverviewMember[];
};

export type CircleOverviewProviderInput = {
  circleId: string;
  viewerId: string | null;
  viewerRoleOverride?: CircleRoleKey | null;
};

export type CircleOverviewProvider = {
  getOverview(
    input: CircleOverviewProviderInput,
  ): Promise<CircleOverviewViewModel>;
};
