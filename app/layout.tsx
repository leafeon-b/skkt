import "./globals.css";

import { Metadata } from "next";
import { Shippori_Mincho_B1, Zen_Maru_Gothic } from "next/font/google";
import Providers from "./providers";

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
  title: "SKKT",
  description: "将棋研究会の活動記録をつけるアプリケーション",
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
      </body>
    </html>
  );
}
