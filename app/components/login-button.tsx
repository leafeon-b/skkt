"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

type LoginButtonProps = {
  className?: string;
  label?: string;
  callbackUrl?: string;
};

export default function LoginButton({
  className,
  label,
  callbackUrl,
}: LoginButtonProps) {
  return (
    <Button
      className={className}
      onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/home" })}
    >
      {label ?? "Googleでログイン"}
    </Button>
  );
}
