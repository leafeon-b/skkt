import { Button } from "@/components/ui/button";
import type {
  CircleOverviewMember,
  CircleOverviewSession,
  CircleOverviewViewModel,
  CircleRoleKey,
  CircleSessionStatus,
} from "@/server/presentation/view-models/circle-overview";
import Link from "next/link";
import type { ReactNode } from "react";

export type CircleOverviewRoleLink = {
  role: CircleRoleKey;
  label: string;
  href: string;
};

export type CircleOverviewViewProps = {
  overview: CircleOverviewViewModel;
  heroContent?: ReactNode;
  roleLinks?: CircleOverviewRoleLink[];
  getSessionHref?: (session: CircleOverviewSession) => string | null;
  getMemberHref?: (member: CircleOverviewMember) => string | null;
  getNextSessionHref?: (
    nextSession: NonNullable<CircleOverviewViewModel["nextSession"]>,
  ) => string | null;
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

const sessionStatusLabels: Record<CircleSessionStatus, string> = {
  done: "開催済み",
  scheduled: "予定",
  draft: "準備中",
};

const sessionStatusClasses: Record<CircleSessionStatus, string> = {
  done: "bg-(--brand-moss)/15 text-(--brand-ink)",
  scheduled: "bg-(--brand-sky)/20 text-(--brand-ink)",
  draft: "bg-(--brand-gold)/20 text-(--brand-ink)",
};

const panelStatusClasses: Record<string, string> = {
  要対応: "bg-(--brand-gold)/25 text-(--brand-ink)",
  進行中: "bg-(--brand-sky)/20 text-(--brand-ink)",
  準備中: "bg-(--brand-moss)/20 text-(--brand-ink)",
  登録済み: "bg-(--brand-moss)/20 text-(--brand-ink)",
  確認中: "bg-(--brand-sky)/20 text-(--brand-ink)",
  お知らせ: "bg-(--brand-ink)/10 text-(--brand-ink)",
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
  roleLinks,
  getSessionHref,
  getMemberHref,
  getNextSessionHref,
}: CircleOverviewViewProps) {
  const roleLabel = overview.viewerRole
    ? roleLabels[overview.viewerRole]
    : null;
  const roleBadgeClassName = overview.viewerRole
    ? roleClasses[overview.viewerRole]
    : "bg-(--brand-ink)/10 text-(--brand-ink)";
  const isSingleAction = overview.actions.length === 1;
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
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:min-w-60 sm:max-w-[320px]">
            {roleLinks?.length ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {roleLinks.map((link) => {
                  const isActive = overview.viewerRole === link.role;
                  return (
                    <Link
                      key={link.role}
                      href={link.href}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                        isActive
                          ? "border-(--brand-ink)/30 bg-(--brand-ink)/10 text-(--brand-ink)"
                          : "border-border/60 bg-white/70 text-(--brand-ink-muted) hover:border-border hover:text-(--brand-ink)"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
            <div
              className={`flex gap-3 ${isSingleAction ? "flex-col" : "flex-wrap"}`}
            >
              {overview.actions.map((action) => {
                const button = (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className={`${action.className ?? ""} ${isSingleAction ? "w-full" : ""}`.trim()}
                  >
                    {action.label}
                  </Button>
                );

                if (!action.href) {
                  return button;
                }

                return (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className={`${action.className ?? ""} ${isSingleAction ? "w-full" : ""}`.trim()}
                    asChild
                  >
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-(--brand-ink)">
              最近の開催
            </p>
            <Button
              variant="ghost"
              className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
            >
              すべて見る
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {overview.recentSessions.length === 0 ? (
              <p className="text-xs text-(--brand-ink-muted)">
                まだ開催回がありません
              </p>
            ) : (
              overview.recentSessions.map((session) => {
                const sessionHref = getSessionHref
                  ? getSessionHref(session)
                  : null;
                return (
                  <LinkCard
                    key={session.title}
                    href={sessionHref}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-(--brand-ink)">
                        {session.title}
                      </p>
                      <p className="text-xs text-(--brand-ink-muted)">
                        {session.dateLabel}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        sessionStatusClasses[session.status] ??
                        "bg-(--brand-ink)/10 text-(--brand-ink)"
                      }`}
                    >
                      {sessionStatusLabels[session.status] ?? session.status}
                    </span>
                  </LinkCard>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {overview.rolePanel ? (
            <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-(--brand-ink)">
                  {overview.rolePanel.title}
                </p>
                <Button
                  variant="ghost"
                  className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
                >
                  すべて見る
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {overview.rolePanel.items.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-(--brand-ink)">
                        {item.title}
                      </p>
                      <p className="text-xs text-(--brand-ink-muted)">
                        {item.meta}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        panelStatusClasses[item.status] ??
                        "bg-(--brand-ink)/10 text-(--brand-ink)"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
