"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HelpCircle, Home } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

const items = [
  { title: "ホーム", href: "/home", icon: Home },
  { title: "ヘルプ", href: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const participationsQuery = trpc.users.circles.participations.list.useQuery(
    {},
  );
  const circleItems = participationsQuery.data ?? [];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarTrigger />
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>参加中の研究会</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {participationsQuery.isLoading ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="truncate">読み込み中...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : participationsQuery.isError ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="truncate">取得に失敗しました</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : circleItems.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="truncate">参加中の研究会はありません</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                circleItems.map((item) => (
                  <SidebarMenuItem key={item.circleId}>
                    <SidebarMenuButton asChild>
                      <Link href={`/circles/${item.circleId}`}>
                        <span className="truncate">{item.circleName}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
