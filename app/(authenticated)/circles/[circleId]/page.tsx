import { CircleOverviewView } from "@/app/(authenticated)/circles/components/circle-overview-view";
import { getCircleOverviewViewModel } from "@/server/presentation/providers/circle-overview-provider";
import { NotFoundError } from "@/server/domain/common/errors";
import { notFound } from "next/navigation";

type CircleDetailPageProps = {
  params: Promise<{ circleId: string }>;
};

export default async function CircleDetailPage({
  params,
}: CircleDetailPageProps) {
  const { circleId } = await params;
  if (!circleId) {
    notFound();
  }

  let overview;
  try {
    overview = await getCircleOverviewViewModel(circleId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <CircleOverviewView
      overview={overview}
      getNextSessionHref={(session) =>
        session.id ? `/circle-sessions/${session.id}` : null
      }
      getCreateSessionHref={() => `/circles/${circleId}/sessions/new`}
      getInviteLinkHref={() => `/circles/${circleId}/invite-link`}
    />
  );
}
