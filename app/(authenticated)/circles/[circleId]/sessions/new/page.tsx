import { createContext } from "@/server/presentation/trpc/context";
import { forbidden } from "next/navigation";
import { CircleSessionCreateForm } from "./circle-session-create-form";

type NewCircleSessionPageProps = {
  params: Promise<{ circleId: string }>;
  searchParams: Promise<{
    startsAt?: string;
    title?: string;
    endsAt?: string;
    location?: string;
    note?: string;
  }>;
};

export default async function NewCircleSessionPage({
  params,
  searchParams,
}: NewCircleSessionPageProps) {
  const { circleId } = await params;

  const ctx = await createContext();
  if (ctx.actorId === null) {
    forbidden();
  }
  const canCreate = await ctx.accessService.canCreateCircleSession(
    ctx.actorId,
    circleId,
  );
  if (!canCreate) {
    forbidden();
  }

  const { startsAt, title, endsAt, location, note } = await searchParams;
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
  const validStartsAt = dateFormat.test(startsAt ?? "") ? startsAt : undefined;
  const validEndsAt = dateFormat.test(endsAt ?? "") ? endsAt : undefined;
  const validTitle = title && title.length <= 100 ? title : undefined;
  const validLocation =
    location && location.length <= 200 ? location : undefined;
  const validNote = note && note.length <= 1000 ? note : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8">
      <h1 className="text-2xl font-(--font-display) text-(--brand-ink)">
        予定の作成
      </h1>
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt={validStartsAt}
        defaultTitle={validTitle}
        defaultEndsAt={validEndsAt}
        defaultLocation={validLocation}
        defaultNote={validNote}
      />
    </div>
  );
}
