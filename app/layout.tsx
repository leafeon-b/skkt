import type { Metadata } from "next";
import { AppSidebar } from "./components/app-sidebar";
import Footer from "./components/footer";
import Header from "./components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "将研ログ",
  description: "将棋研究会の活動記録をつけるアプリケーション",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body className="h-screen grid grid-rows-[auto_1fr_au">
        <Header />
        {/* <SidebarProvider> */}
        <div className="grid grid-cols-[240px_1fr] min-h-0">
          <AppSidebar />
          <main className="p-6 overflow-auto">{children}</main>
        </div>
        <Footer />
        {/* </SidebarProvider> */}
      </body>
    </html>
  );
}
