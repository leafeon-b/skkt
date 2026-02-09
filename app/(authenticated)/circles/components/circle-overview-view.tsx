import { CircleOverviewCalendar } from "@/app/(authenticated)/circles/components/circle-overview-calendar";
import { Button } from "@/components/ui/button";
import type {
  CircleOverviewMember,
  CircleOverviewViewModel,
  CircleRoleKey,
} from "@/server/presentation/view-models/circle-overview";
import Link from "next/link";
import type { ReactNode } from "react";

export type CircleOverviewViewProps = {
  overview: CircleOverviewViewModel;
  heroContent?: ReactNode;
  getMemberHref?: (member: CircleOverviewMember) => string | null;
  getNextSessionHref?: (
    nextSession: NonNullable<CircleOverviewViewModel["nextSession"]>,
  ) => string | null;
  getCreateSessionHref?: () => string | null;
};

const roleLabels: Record<CircleRoleKey, string> = {
  owner: "オーナー",
  manager: "マネージャー",
  member: "メンバー",
};

const roleClasses: Record<CircleRoleKey, string> = {
  owner: "bg-(--brand-gold)/25 text-(--brand-ink)",
  manager: "bg-(--brand-sky)/25 text-(--brand-ink)",
  member: "bg-(--brand-moss)/20 text-(--brand-ink)",
};

type LinkCardProps = {
  href?: string | null;
  className: string;
  children: ReactNode;
};

const LinkCard = ({ href, className, children }: LinkCardProps) => {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <div className={className}>{children}</div>;
};

export function CircleOverviewView({
  overview,
  heroContent,
  getMemberHref,
  getNextSessionHref,
  getCreateSessionHref,
}: CircleOverviewViewProps) {
  const roleLabel = overview.viewerRole
    ? roleLabels[overview.viewerRole]
    : null;
  const roleBadgeClassName = overview.viewerRole
    ? roleClasses[overview.viewerRole]
    : "bg-(--brand-ink)/10 text-(--brand-ink)";
  const scheduleText = overview.scheduleNote
    ? `参加者 ${overview.participationCount}名 / ${overview.scheduleNote}`
    : `参加者 ${overview.participationCount}名`;

  const defaultHero = (
    <>
      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
          {overview.circleName}
        </h1>
        {roleLabel ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs ${roleBadgeClassName}`}
          >
            {roleLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-(--brand-ink-muted)">{scheduleText}</p>
    </>
  );

  const nextSession = overview.nextSession;
  const nextSessionHref =
    nextSession && getNextSessionHref ? getNextSessionHref(nextSession) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-60 flex-1">
            {heroContent ?? defaultHero}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-(--brand-ink-muted)">
                次回日程
              </p>
              {nextSession ? (
                <LinkCard
                  href={nextSessionHref}
                  className="block rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm transition hover:border-border hover:bg-white hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-(--brand-ink)">
                    {nextSession.title}
                  </p>
                  <p className="mt-1 text-xs text-(--brand-ink-muted)">
                    {nextSession.dateTimeLabel}
                    {nextSession.locationLabel
                      ? ` / ${nextSession.locationLabel}`
                      : ""}
                  </p>
                </LinkCard>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-white/70 px-4 py-3 text-xs text-(--brand-ink-muted)">
                  次回日程は未設定です
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <CircleOverviewCalendar
          sessions={overview.sessions}
          createSessionHref={
            overview.viewerRole === "owner" || overview.viewerRole === "manager"
              ? (getCreateSessionHref?.() ?? null)
              : null
          }
        />

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-(--brand-ink)">
                参加メンバー
              </p>
              <Button
                variant="ghost"
                className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
              >
                すべて見る
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {overview.members.length === 0 ? (
                <p className="text-xs text-(--brand-ink-muted)">
                  まだ参加メンバーがいません
                </p>
              ) : (
                overview.members.map((member) => {
                  const memberHref = getMemberHref
                    ? getMemberHref(member)
                    : null;
                  const memberRoleLabel = roleLabels[member.role] ?? "メンバー";
                  return (
                    <LinkCard
                      key={member.userId}
                      href={memberHref}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-semibold text-(--brand-ink)">
                          {member.name}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          roleClasses[member.role] ??
                          "bg-(--brand-ink)/10 text-(--brand-ink)"
                        }`}
                      >
                        {memberRoleLabel}
                      </span>
                    </LinkCard>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
