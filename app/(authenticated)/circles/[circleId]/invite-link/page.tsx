import { createContext } from "@/server/presentation/trpc/context";
import { circleId as toCircleId } from "@/server/domain/common/ids";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { InviteLinkGenerator } from "./invite-link-generator";

type InviteLinkPageProps = {
  params: Promise<{ circleId: string }>;
};

export default async function InviteLinkPage({ params }: InviteLinkPageProps) {
  const { circleId } = await params;
  if (!circleId) {
    notFound();
  }

  const ctx = await createContext();
  const circle = await ctx.circleService.getCircle(ctx.actorId, toCircleId(circleId));
  if (!circle) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8">
      <Link
        href={`/circles/${circleId}`}
        className="flex items-center gap-1 text-xs text-(--brand-ink-muted) hover:text-(--brand-ink)"
      >
        <ChevronLeft className="size-4" />
        {circle.name} に戻る
      </Link>
      <h1 className="text-2xl font-(--font-display) text-(--brand-ink)">
        メンバーを招待
      </h1>
      <InviteLinkGenerator circleId={circleId} />
    </div>
  );
}
