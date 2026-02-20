import { router } from "@/server/presentation/trpc/trpc";
import { circleRouter } from "@/server/presentation/trpc/routers/circle";
import { circleSessionRouter } from "@/server/presentation/trpc/routers/circle-session";
import { holidayRouter } from "@/server/presentation/trpc/routers/holiday";
import { matchRouter } from "@/server/presentation/trpc/routers/match";
import { userRouter } from "@/server/presentation/trpc/routers/user";

export const appRouter = router({
  circles: circleRouter,
  circleSessions: circleSessionRouter,
  holidays: holidayRouter,
  matches: matchRouter,
  users: userRouter,
});

export type AppRouter = typeof appRouter;
