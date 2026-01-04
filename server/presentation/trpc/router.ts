import { router } from "@/server/presentation/trpc/trpc";
import { circleRouter } from "@/server/presentation/trpc/routers/circle";
import { circleSessionRouter } from "@/server/presentation/trpc/routers/circle-session";
import { matchRouter } from "@/server/presentation/trpc/routers/match";
import { userRouter } from "@/server/presentation/trpc/routers/user";

export const appRouter = router({
  circles: circleRouter,
  circleSessions: circleSessionRouter,
  matches: matchRouter,
  users: userRouter,
});

export type AppRouter = typeof appRouter;
