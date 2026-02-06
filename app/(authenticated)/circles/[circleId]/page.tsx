import { CircleOverviewView } from "@/app/(authenticated)/circles/components/circle-overview-view";
import { createCircleOverviewProvider } from "@/server/presentation/providers/circle-overview-provider";
import { createContext } from "@/server/presentation/trpc/context";
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

  const ctx = await createContext();
  const provider = createCircleOverviewProvider({
    circleService: ctx.circleService,
    circleParticipationService: ctx.circleParticipationService,
    circleSessionService: ctx.circleSessionService,
    userService: ctx.userService,
    getActorId: async () => ctx.actorId,
  });

  let overview;
  try {
    overview = await provider.getOverview({
      circleId,
      viewerId: null,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <CircleOverviewView
      overview={overview}
      getSessionHref={(session) =>
        session.id ? `/circle-sessions/${session.id}` : null
      }
      getNextSessionHref={(session) =>
        session.id ? `/circle-sessions/${session.id}` : null
      }
    />
  );
}
