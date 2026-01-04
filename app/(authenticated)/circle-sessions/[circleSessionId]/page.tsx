import { CircleSessionDetailContainer } from "@/app/(authenticated)/circle-sessions/components/circle-session-detail-container";
import { trpcCircleSessionDetailProvider } from "@/server/presentation/providers/trpc-circle-session-detail-provider";

type CircleSessionDetailPageProps = {
  params: { circleSessionId: string };
};

export default function CircleSessionDetailPage({
  params,
}: CircleSessionDetailPageProps) {
  return (
    <CircleSessionDetailContainer
      provider={trpcCircleSessionDetailProvider}
      circleSessionId={params.circleSessionId}
      viewerId={null}
    />
  );
}
