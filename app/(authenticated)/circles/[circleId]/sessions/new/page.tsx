import { CircleSessionCreateForm } from "./circle-session-create-form";

type NewCircleSessionPageProps = {
  params: Promise<{ circleId: string }>;
};

export default async function NewCircleSessionPage({
  params,
}: NewCircleSessionPageProps) {
  const { circleId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8">
      <h1 className="text-2xl font-(--font-display) text-(--brand-ink)">
        新規開催回の作成
      </h1>
      <CircleSessionCreateForm circleId={circleId} />
    </div>
  );
}
