"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

type LoginButtonProps = {
  className?: string;
  label?: string;
};

export default function LoginButton({ className, label }: LoginButtonProps) {
  return (
    <Button
      className={className}
      onClick={() => signIn("google", { callbackUrl: "/home" })}
    >
      {label ?? "Googleでログイン"}
    </Button>
  );
}
