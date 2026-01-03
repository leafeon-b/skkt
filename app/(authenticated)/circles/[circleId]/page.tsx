import { CircleDemoPage } from "@/app/(authenticated)/circles/demo/page";
import CircleHeroClient from "@/app/(authenticated)/circles/[circleId]/circle-hero-client";

export default function CircleDetailPage() {
  return <CircleDemoPage heroContent={<CircleHeroClient />} />;
}
