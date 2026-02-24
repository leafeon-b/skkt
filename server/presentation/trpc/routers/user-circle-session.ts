import { userCircleSessionMembershipRouter } from "@/server/presentation/trpc/routers/user-circle-session-membership";
import { router } from "@/server/presentation/trpc/trpc";

export const userCircleSessionRouter = router({
  memberships: userCircleSessionMembershipRouter,
});
