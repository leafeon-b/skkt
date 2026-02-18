import { notFound } from "next/navigation";
import { getInviteLinkPageData } from "@/server/presentation/providers/invite-link-provider";
import Footer from "@/app/components/footer";
import { InviteAcceptView } from "./invite-accept-view";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  if (!token) {
    notFound();
  }

  const data = await getInviteLinkPageData(token);
  if (!data) {
    notFound();
  }

  return (
    <div className="flex min-h-svh flex-col bg-(--brand-paper)">
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <InviteAcceptView
            token={token}
            circleName={data.circleName}
            expired={data.expired}
            isAuthenticated={data.isAuthenticated}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
