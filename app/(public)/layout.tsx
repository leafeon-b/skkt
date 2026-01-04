import Footer from "@/app/components/footer";
import { getSession } from "@/server/application/auth/session";
import { redirect } from "next/navigation";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const session = await getSession();

  if (session?.user) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-svh flex-col bg-(--brand-paper)">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
