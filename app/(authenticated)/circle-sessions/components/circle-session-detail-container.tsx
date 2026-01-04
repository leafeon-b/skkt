import { CircleSessionDetailView } from "@/app/(authenticated)/circle-sessions/components/circle-session-detail-view";
import type {
  CircleSessionDetailProvider,
  CircleSessionDetailProviderInput,
} from "@/server/presentation/view-models/circle-session-detail";

export type CircleSessionDetailContainerProps = {
  provider: CircleSessionDetailProvider;
  circleSessionId: string;
  viewerId: CircleSessionDetailProviderInput["viewerId"];
};

export async function CircleSessionDetailContainer({
  provider,
  circleSessionId,
  viewerId,
}: CircleSessionDetailContainerProps) {
  const detail = await provider.getDetail({
    circleSessionId,
    viewerId,
  });

  return <CircleSessionDetailView detail={detail} />;
}
