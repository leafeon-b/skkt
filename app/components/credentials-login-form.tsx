"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CredentialsLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/home",
      });
      if (!result || result.error) {
        setErrorMessage("メールアドレスまたはパスワードが正しくありません。");
        return;
      }
      if (result.url) {
        router.push(result.url);
        return;
      }
      setErrorMessage("ログインに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-(--brand-ink-muted)">
          メールアドレス
        </label>
        <Input
          type="email"
          value={email}
          autoComplete="email"
          placeholder="demo1@example.com"
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-(--brand-ink-muted)">
          パスワード
        </label>
        <Input
          type="password"
          value={password}
          autoComplete="current-password"
          placeholder="••••••••"
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {errorMessage ? (
        <p className="text-xs font-semibold text-red-600">{errorMessage}</p>
      ) : null}
      <Button
        type="submit"
        className="w-full bg-(--brand-ink) text-white hover:bg-(--brand-ink)/90"
        disabled={isSubmitting}
      >
        メールでログイン
      </Button>
    </form>
  );
}
