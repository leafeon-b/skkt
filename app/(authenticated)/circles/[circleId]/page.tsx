import { CircleOverviewContainer } from "@/app/(authenticated)/circles/components/circle-overview-container";
import { trpcCircleOverviewProvider } from "@/server/presentation/providers/trpc-circle-overview-provider";

type CircleDetailPageProps = {
  params: { circleId: string };
};

export default function CircleDetailPage({ params }: CircleDetailPageProps) {
  return (
    <CircleOverviewContainer
      provider={trpcCircleOverviewProvider}
      circleId={params.circleId}
      viewerId={null}
      getSessionHref={(session) =>
        session.id ? `/circle-sessions/${session.id}` : null
      }
      getNextSessionHref={(session) =>
        session.id ? `/circle-sessions/${session.id}` : null
      }
    />
  );
}
