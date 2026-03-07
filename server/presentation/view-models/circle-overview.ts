export type CircleRoleKey = "owner" | "manager" | "member";

export type CircleOverviewSession = {
  id: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
};

export type CircleOverviewMember = {
  userId: string;
  name: string;
  role: CircleRoleKey;
  canChangeRole: boolean;
  canRemoveMember: boolean;
};

export type CircleOverviewViewModel = {
  circleId: string;
  circleName: string;
  membershipCount: number;
  scheduleNote: string | null;
  nextSession: {
    id: string | null;
    title: string;
    dateTimeLabel: string;
    locationLabel: string | null;
  } | null;
  viewerRole: CircleRoleKey | null;
  sessions: CircleOverviewSession[];
  members: CircleOverviewMember[];
  holidayDates: string[];
  canDeleteCircle: boolean;
  canRenameCircle: boolean;
  canTransferOwnership: boolean;
  canEditNotificationSetting: boolean;
  viewerUserId: string | null;
};
