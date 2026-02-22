import { UserProfileView } from "@/app/(authenticated)/users/components/user-profile-view";
import { getUserProfileViewModel } from "@/server/presentation/providers/user-profile-provider";
import { NotFoundError } from "@/server/domain/common/errors";
import { notFound } from "next/navigation";

type UserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  if (!userId) {
    notFound();
  }

  let profile;
  try {
    profile = await getUserProfileViewModel(userId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return <UserProfileView profile={profile} />;
}
