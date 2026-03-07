import { router } from "@/server/presentation/trpc/trpc";
import { circleRouter } from "@/server/presentation/trpc/routers/circle";
import { circleSessionRouter } from "@/server/presentation/trpc/routers/circle-session";
import { holidayRouter } from "@/server/presentation/trpc/routers/holiday";
import { matchRouter } from "@/server/presentation/trpc/routers/match";
import { roundRobinScheduleRouter } from "@/server/presentation/trpc/routers/round-robin-schedule";
import { userRouter } from "@/server/presentation/trpc/routers/user";
import { notificationPreferenceRouter } from "@/server/presentation/trpc/routers/notification-preference";

export const appRouter = router({
  circles: circleRouter,
  circleSessions: circleSessionRouter,
  holidays: holidayRouter,
  matches: matchRouter,
  roundRobinSchedules: roundRobinScheduleRouter,
  users: userRouter,
  notificationPreferences: notificationPreferenceRouter,
});

export type AppRouter = typeof appRouter;
