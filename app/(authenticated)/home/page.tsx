import { HomeView } from "@/app/(authenticated)/home/home-view";
import { getHomeViewModel } from "@/server/presentation/providers/home-provider";

export default async function Home() {
  const viewModel = await getHomeViewModel();
  return <HomeView viewModel={viewModel} />;
}
