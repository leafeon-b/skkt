"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const titleClass =
  "mt-3 text-3xl font-(--font-display) text-(--brand-ink) sm:text-4xl";
const subtitleClass = "mt-3 text-sm text-(--brand-ink-muted)";

export default function CircleHeroClient() {
  const params = useParams<{ circleId?: string | string[] }>();
  const circleId =
    typeof params.circleId === "string"
      ? params.circleId
      : params.circleId?.[0];

  const circleQuery = trpc.circles.get.useQuery(
    { circleId: circleId ?? "" },
    { enabled: Boolean(circleId) },
  );
  const participantsQuery = trpc.circles.participants.list.useQuery(
    { circleId: circleId ?? "" },
    { enabled: Boolean(circleId) },
  );

  const title = circleQuery.isLoading
    ? "読み込み中..."
    : circleQuery.data?.name ?? "研究会が見つかりません";

  const participantCount = participantsQuery.data?.length;
  const subtitle = participantsQuery.isLoading
    ? "参加者を読み込み中..."
    : participantCount != null
      ? `参加者 ${participantCount}名 / 毎週土曜 18:00 - 21:00`
      : "参加者情報を取得できませんでした";

  return (
    <>
      <h1 className={titleClass}>{title}</h1>
      <p className={subtitleClass}>{subtitle}</p>
    </>
  );
}
