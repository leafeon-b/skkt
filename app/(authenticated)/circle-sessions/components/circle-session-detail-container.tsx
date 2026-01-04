import {
  CircleSessionDetailView,
  type CircleSessionRoleLink,
} from "@/app/(authenticated)/circle-sessions/components/circle-session-detail-view";
import type {
  CircleSessionDetailProvider,
  CircleSessionDetailProviderInput,
} from "@/server/presentation/view-models/circle-session-detail";

export type CircleSessionDetailContainerProps = {
  provider: CircleSessionDetailProvider;
  circleSessionId: string;
  viewerId: CircleSessionDetailProviderInput["viewerId"];
  roleLinks?: CircleSessionRoleLink[];
};

export async function CircleSessionDetailContainer({
  provider,
  circleSessionId,
  viewerId,
  roleLinks,
}: CircleSessionDetailContainerProps) {
  const detail = await provider.getDetail({
    circleSessionId,
    viewerId,
  });

  return <CircleSessionDetailView detail={detail} roleLinks={roleLinks} />;
}
