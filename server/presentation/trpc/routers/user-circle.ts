import { userCircleMembershipRouter } from "@/server/presentation/trpc/routers/user-circle-membership";
import { router } from "@/server/presentation/trpc/trpc";

export const userCircleRouter = router({
  memberships: userCircleMembershipRouter,
});
