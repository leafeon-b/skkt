import Footer from "@/app/components/footer";
import { nextAuthSessionService } from "@/server/infrastructure/auth/nextauth-session-service";
import { redirect } from "next/navigation";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const session = await nextAuthSessionService.getSession();

  if (session?.user) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
