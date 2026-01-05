import { CircleSessionDetailView } from "@/app/(authenticated)/circle-sessions/components/circle-session-detail-view";
import { trpcCircleSessionDetailProvider } from "@/server/presentation/providers/trpc-circle-session-detail-provider";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

type CircleSessionDetailPageProps = {
  params: { circleSessionId: string };
};

export default async function CircleSessionDetailPage({
  params,
}: CircleSessionDetailPageProps) {
  const { circleSessionId } = await params;
  if (!circleSessionId) {
    notFound();
  }

  let detail;
  try {
    detail = await trpcCircleSessionDetailProvider.getDetail({
      circleSessionId,
      viewerId: null,
    });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return <CircleSessionDetailView detail={detail} />;
}
