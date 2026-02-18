import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { Metadata } from "next";
import { Shippori_Mincho_B1, Zen_Maru_Gothic } from "next/font/google";
import Providers from "./providers";

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "block",
  fallback: ["Hiragino Kaku Gothic ProN", "Yu Gothic", "sans-serif"],
});

const shippori = Shippori_Mincho_B1({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "block",
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "serif"],
});

export const metadata: Metadata = {
  title: "SKKT",
  description: "将棋研究会の活動記録をつけるアプリケーション",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${zenMaru.variable} ${shippori.variable} min-h-svh w-screen bg-background overflow-x-hidden`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
