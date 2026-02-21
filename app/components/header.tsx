"use client";

import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CircleCreateDialog } from "./circle-create-dialog";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <header className="border-b bg-muted px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <Image
          src="/logo.png"
          alt="SKKT"
          width={246}
          height={55}
          className="h-7 w-auto"
          priority
        />
      </div>

      <div className="flex items-center gap-3">
        <CircleCreateDialog />
        <UserMenu />
      </div>
    </header>
  );
}
