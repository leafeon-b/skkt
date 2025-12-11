import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, NotebookPen, UserSearch } from "lucide-react";
import Link from "next/link";

const items = [
  { title: "ホーム", href: "/", icon: Home },
  { title: "研究記録", href: "/records", icon: NotebookPen },
  { title: "メンバー", href: "/members", icon: UserSearch },
];

export function AppSidebar() {
  return (
    <aside className="border-r bg-gray-50 h-full">
      <ScrollArea className="h-full p-4">
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="justify-start"
              asChild
            >
              <Link href={item.href}>
                <item.icon /> {item.title}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
