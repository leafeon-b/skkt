import type { CircleOverviewMember } from "@/server/presentation/view-models/circle-overview";

export type CircleSettingsViewModel = {
  circleId: string;
  circleName: string;
  sessionEmailNotificationEnabled: boolean;
  viewerUserId: string;
  members: CircleOverviewMember[];
};
