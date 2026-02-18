import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type { HomeViewModel } from "@/server/presentation/view-models/home";

export async function getHomeViewModel(): Promise<HomeViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const sessions = await caller.users.circleSessions.participations.list({});

  const now = new Date();
  const upcoming = sessions
    .filter((s) => s.startsAt > now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const next = upcoming[0] ?? null;

  return {
    nextSession: next
      ? {
          circleSessionId: next.circleSessionId,
          title: next.title,
          startsAt: next.startsAt.toISOString(),
          endsAt: next.endsAt.toISOString(),
          location: next.location,
        }
      : null,
    calendarEvents: sessions.map((s) => ({
      id: s.circleSessionId,
      title: s.title,
      start: s.startsAt.toISOString(),
      end: s.endsAt.toISOString(),
      url: `/circle-sessions/${s.circleSessionId}`,
    })),
  };
}
