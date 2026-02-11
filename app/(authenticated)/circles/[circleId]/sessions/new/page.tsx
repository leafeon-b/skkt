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
  const { startsAt, title, endsAt, location, note } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8">
      <h1 className="text-2xl font-(--font-display) text-(--brand-ink)">
        新規開催回の作成
      </h1>
      <CircleSessionCreateForm
        circleId={circleId}
        defaultStartsAt={startsAt}
        defaultTitle={title}
        defaultEndsAt={endsAt}
        defaultLocation={location}
        defaultNote={note}
      />
    </div>
  );
}
