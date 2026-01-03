import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CircleDemoRole = "owner" | "manager" | "member";

type RoleAction = {
  label: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  className?: string;
};

type RolePanelItem = {
  title: string;
  meta: string;
  status: string;
};

type RoleConfig = {
  label: string;
  description: string;
  highlights: string[];
  dotClassName: string;
  actions: RoleAction[];
  panelTitle: string;
  panelItems: RolePanelItem[];
};

const roleLinks: { role: CircleDemoRole; label: string; href: string }[] = [
  { role: "owner", label: "オーナー", href: "/circles/demo/owner" },
  { role: "manager", label: "マネージャー", href: "/circles/demo/manager" },
  { role: "member", label: "メンバー", href: "/circles/demo/member" },
];

const members = [
  { name: "藤井 聡太", role: "オーナー" },
  { name: "羽生 善治", role: "マネージャー" },
  { name: "渡辺 明", role: "マネージャー" },
  { name: "伊藤 匠", role: "メンバー" },
];

const roleClasses: Record<string, string> = {
  オーナー: "bg-(--brand-gold)/25 text-(--brand-ink)",
  マネージャー: "bg-(--brand-sky)/25 text-(--brand-ink)",
  メンバー: "bg-(--brand-moss)/20 text-(--brand-ink)",
};

const sessions = [
  { title: "第42回 週末研究会", date: "2025/03/12", status: "開催済み" },
  { title: "第41回 週末研究会", date: "2025/02/26", status: "開催済み" },
  { title: "冬季対局会", date: "2025/02/11", status: "開催済み" },
];

const sessionStatusClasses: Record<string, string> = {
  開催済み: "bg-(--brand-moss)/15 text-(--brand-ink)",
  予定: "bg-(--brand-sky)/20 text-(--brand-ink)",
  準備中: "bg-(--brand-gold)/20 text-(--brand-ink)",
};

const panelStatusClasses: Record<string, string> = {
  要対応: "bg-(--brand-gold)/25 text-(--brand-ink)",
  進行中: "bg-(--brand-sky)/20 text-(--brand-ink)",
  準備中: "bg-(--brand-moss)/20 text-(--brand-ink)",
  登録済み: "bg-(--brand-moss)/20 text-(--brand-ink)",
  確認中: "bg-(--brand-sky)/20 text-(--brand-ink)",
  お知らせ: "bg-(--brand-ink)/10 text-(--brand-ink)",
};

const defaultActions: RoleAction[] = [
  {
    label: "開催日程を追加",
    className: "bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90",
  },
  {
    label: "メンバー管理",
    variant: "outline",
    className:
      "border-(--brand-moss)/30 bg-white/70 text-(--brand-ink) hover:bg-white",
  },
];

const ownerManagerBase = {
  description: "研究会の運営と方針を統括",
  highlights: [
    "開催スケジュールの確定",
    "参加申請と権限の管理",
    "研究会の方針・概要更新",
  ],
  actions: [
    {
      label: "開催日程を追加",
      className: "bg-(--brand-gold) text-(--brand-ink) hover:bg-(--brand-gold)/90",
    },
    {
      label: "メンバー管理",
      variant: "outline",
      className:
        "border-(--brand-gold)/40 bg-white/70 text-(--brand-ink) hover:bg-white",
    },
  ],
  panelTitle: "運営タスク",
  panelItems: [
    { title: "参加申請の承認", meta: "承認待ち 2件", status: "要対応" },
    { title: "次期の役割設定", meta: "4月期の割り当て", status: "準備中" },
    { title: "開催場所の更新", meta: "京都キャンパス A", status: "進行中" },
  ],
};

const roleConfigs: Record<CircleDemoRole, RoleConfig> = {
  owner: {
    label: "オーナー",
    dotClassName: "bg-(--brand-gold)",
    ...ownerManagerBase,
  },
  manager: {
    label: "マネージャー",
    dotClassName: "bg-(--brand-gold)",
    ...ownerManagerBase,
  },
  member: {
    label: "メンバー",
    description: "参加登録と対局準備を担当",
    highlights: ["参加予定の登録", "対局テーマの確認", "連絡事項の対応"],
    dotClassName: "bg-(--brand-moss)",
    actions: [
      {
        label: "参加予定を登録",
        className: "bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90",
      },
    ],
    panelTitle: "メンバーの参加メモ",
    panelItems: [
      { title: "次回の参加", meta: "出席で登録済み", status: "登録済み" },
      { title: "対局テーマ", meta: "中盤の形を研究", status: "確認中" },
      { title: "連絡事項", meta: "3/15 会場変更", status: "お知らせ" },
    ],
  },
};

type CircleDemoPageProps = {
  heroContent?: ReactNode;
  role?: CircleDemoRole;
};

export function CircleDemoPage({ heroContent, role }: CircleDemoPageProps) {
  const roleConfig = role ? roleConfigs[role] : null;
  const actions = roleConfig?.actions ?? defaultActions;
  const roleBadgeClassName = roleConfig
    ? roleClasses[roleConfig.label] ?? "bg-(--brand-ink)/10 text-(--brand-ink)"
    : "bg-(--brand-ink)/10 text-(--brand-ink)";
  const isSingleAction = actions.length === 1;

  const fallbackHero = (
    <>
      <h1 className="mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl">
        京大将棋研究会
      </h1>
      <p className="mt-3 text-sm text-(--brand-ink-muted)">
        参加者 28名 / 毎週土曜 18:00 - 21:00
      </p>
    </>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[240px] flex-1">
            {heroContent ?? fallbackHero}
            <Link
              href="/circle-sessions/demo"
              className="mt-4 block rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm transition hover:border-border hover:bg-white hover:shadow-sm"
            >
              <p className="text-xs font-semibold text-(--brand-ink)">
                次回日程
              </p>
              <p className="mt-1 text-(--brand-ink-muted)">
                2026/03/26 18:00 - 21:00 / オンライン
              </p>
            </Link>
          </div>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:min-w-[240px] sm:max-w-[320px]">
            {roleConfig ? (
              <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-(--brand-ink)">
                  あなたのロール
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${roleBadgeClassName}`}
                  >
                    {roleConfig.label}
                  </span>
                  <span className="text-xs text-(--brand-ink-muted)">
                    {roleConfig.description}
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-(--brand-ink)">
                  {roleConfig.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-1.5 w-1.5 rounded-full ${roleConfig.dotClassName}`}
                      />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div
              className={`flex gap-3 ${isSingleAction ? "flex-col" : "flex-wrap"}`}
            >
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className={`${action.className ?? ""} ${isSingleAction ? "w-full" : ""}`.trim()}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {roleConfig ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-(--brand-ink)">
              ロール別デモ
            </p>
            {roleLinks.map((link) => {
              const isActive = role === link.role;
              return (
                <Link
                  key={link.role}
                  href={link.href}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
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
            {sessions.map((session) => (
              <Link
                key={session.title}
                href="/circle-sessions/demo"
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/70 p-4 transition hover:border-border hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-(--brand-ink)">
                    {session.title}
                  </p>
                  <p className="text-xs text-(--brand-ink-muted)">
                    {session.date}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    sessionStatusClasses[session.status] ??
                    "bg-(--brand-ink)/10 text-(--brand-ink)"
                  }`}
                >
                  {session.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {roleConfig ? (
            <div className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-(--brand-ink)">
                  {roleConfig.panelTitle}
                </p>
                <Button
                  variant="ghost"
                  className="text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
                >
                  すべて見る
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {roleConfig.panelItems.map((item) => (
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
              {members.map((member) => (
                <Link
                  key={member.name}
                  href="/users/demo"
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
                    {member.role}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CircleDemoOwnerPage() {
  return <CircleDemoPage role="owner" />;
}
