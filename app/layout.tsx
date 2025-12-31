import { AppSidebar } from "./components/app-sidebar";
import Footer from "./components/footer";
import Header from "./components/header";
import "./globals.css";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Metadata } from "next";
import { Shippori_Mincho_B1, Zen_Maru_Gothic } from "next/font/google";

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
  fallback: ["Hiragino Kaku Gothic ProN", "Yu Gothic", "sans-serif"],
});

const shippori = Shippori_Mincho_B1({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "serif"],
});

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
      <body
        className={`${zenMaru.variable} ${shippori.variable} min-h-svh w-screen bg-background overflow-x-hidden`}
      >
        <SidebarProvider>
          <div className="flex min-h-svh w-full">
            <AppSidebar />
            <SidebarInset className="flex min-w-0 w-full max-w-none flex-1 flex-col overflow-hidden">
              <Header />
              <main className="w-full flex-1 overflow-auto p-6">{children}</main>
              <Footer />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
