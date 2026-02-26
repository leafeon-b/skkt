"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TrpcProvider } from "@/lib/trpc/client";

type ProvidersProps = {
  children: ReactNode;
  nonce?: string;
};

export default function Providers({ children, nonce }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        nonce={nonce}
      >
        <TrpcProvider>{children}</TrpcProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
