import { CircleSettingsView } from "@/app/(authenticated)/circles/components/circle-settings-view";
import { getCircleSettingsViewModel } from "@/server/presentation/providers/circle-settings-provider";
import { NotFoundError } from "@/server/domain/common/errors";
import { notFound } from "next/navigation";

type CircleSettingsPageProps = {
  params: Promise<{ circleId: string }>;
};

export default async function CircleSettingsPage({
  params,
}: CircleSettingsPageProps) {
  const { circleId } = await params;
  if (!circleId) {
    notFound();
  }

  let settings;
  try {
    settings = await getCircleSettingsViewModel(circleId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  if (!settings) {
    notFound();
  }

  return (
    <CircleSettingsView
      settings={settings}
      backHref={`/circles/${circleId}`}
    />
  );
}
