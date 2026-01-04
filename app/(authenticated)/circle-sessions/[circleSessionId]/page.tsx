import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";

type CircleSessionDetailPageProps = {
  params: { circleSessionId: string };
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;

const formatTime = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatDateTimeRange = (startsAt: Date, endsAt: Date) =>
  `${formatDate(startsAt)} ${formatTime(startsAt)} - ${formatTime(endsAt)}`;

export default async function CircleSessionDetailPage({
  params,
}: CircleSessionDetailPageProps) {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const session = await caller.circleSessions
    .get({ circleSessionId: params.circleSessionId })
    .catch((error) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") {
        notFound();
      }
      throw error;
    });

  const circle = await caller.circles.get({ circleId: session.circleId });

  const title = `第${session.sequence}回 研究会`;
  const dateLabel = formatDateTimeRange(session.startsAt, session.endsAt);
  const locationLabel = session.location ? ` / ${session.location}` : "";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <p className="text-xs font-semibold text-(--brand-ink-muted)">開催回</p>
        <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-(--brand-ink-muted)">{circle.name}</p>
        <p className="mt-3 text-sm text-(--brand-ink-muted)">
          {dateLabel}
          {locationLabel}
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-(--brand-ink)">概要</h2>
        <dl className="mt-4 space-y-3 text-sm text-(--brand-ink-muted)">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="min-w-20 text-xs font-semibold text-(--brand-ink)">
              研究会ID
            </dt>
            <dd className="break-all">{circle.id}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt className="min-w-20 text-xs font-semibold text-(--brand-ink)">
              開催回ID
            </dt>
            <dd className="break-all">{session.id}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
