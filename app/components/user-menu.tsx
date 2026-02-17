"use client";

import { useSession, signOut } from "next-auth/react";
// TODO: ダークモード設計完了後に有効化する
// import { useTheme } from "next-themes";
import { User, LogOut, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu() {
  const { data: session } = useSession();
  // TODO: ダークモード設計完了後に有効化する
  // const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleDeleteAccount = () => {
    alert("アカウント削除機能は現在実装中です");
  };

  // TODO: ダークモード設計完了後に有効化する
  // const toggleTheme = () => {
  //   setTheme(theme === "dark" ? "light" : "dark");
  // };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="ユーザーメニュー">
          <User className="h-4 w-4" />
          <span>{session?.user?.name ?? "ユーザー"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-3 py-2 text-sm font-medium border-b">
          {session?.user?.name ?? "ユーザー"}
        </div>
        {/* TODO: ダークモード設計完了後に有効化する
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              ライトモード
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              ダークモード
            </>
          )}
        </DropdownMenuItem>
        */}
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="mr-2 h-4 w-4" />
            設定
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDeleteAccount}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          アカウント削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
