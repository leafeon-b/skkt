import { AppSidebar } from "./components/app-sidebar";
import Footer from "./components/footer";
import Header from "./components/header";
import "./globals.css";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "将研ログ",
  description: "将棋研究会の活動記録をつけるアプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="h-screen">
        <SidebarProvider>
          <div className="flex h-screen flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <SidebarTrigger />
              <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                <main className="p-6 flex-1 overflow-auto">{children}</main>
                <Footer />
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
