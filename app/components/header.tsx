import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export default function Header() {
  return (
    <header className="w-full border-b bg-white p-4 flex items-center justify-between">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem className="text-xl font-bold">
            将研ログ
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex gap-2">
        <Button variant="outline">ログイン</Button>
        <Button>サインアップ</Button>
      </div>
    </header>
  );
}
