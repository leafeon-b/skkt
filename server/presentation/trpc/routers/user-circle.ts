import { userCircleParticipationRouter } from "@/server/presentation/trpc/routers/user-circle-participation";
import { router } from "@/server/presentation/trpc/trpc";

export const userCircleRouter = router({
  participations: userCircleParticipationRouter,
});
