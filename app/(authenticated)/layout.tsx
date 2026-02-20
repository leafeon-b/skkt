import { AppSidebar } from "@/app/components/app-sidebar";
import Footer from "@/app/components/footer";
import Header from "@/app/components/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { nextAuthSessionService } from "@/server/infrastructure/auth/nextauth-session-service";
import { redirect } from "next/navigation";

type AuthenticatedLayoutProps = {
  children: React.ReactNode;
};

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await nextAuthSessionService.getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 w-full max-w-none flex-1 flex-col overflow-hidden bg-transparent!">
          <Header />
          <main className="w-full flex-1 overflow-auto p-6">{children}</main>
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
