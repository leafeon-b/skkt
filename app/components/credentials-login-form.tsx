"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { sanitizeCallbackUrl } from "@/lib/url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CredentialsLoginFormProps = {
  callbackUrl?: string;
};

export default function CredentialsLoginForm({
  callbackUrl,
}: CredentialsLoginFormProps) {
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
        callbackUrl: callbackUrl ?? "/home",
      });
      if (!result || result.error) {
        setErrorMessage("メールアドレスまたはパスワードが正しくありません。");
        return;
      }
      if (result.url) {
        router.push(sanitizeCallbackUrl(result.url));
        return;
      }
      setErrorMessage("ログインに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <p className="text-xs text-(--brand-ink-muted)">
        <span className="text-red-600" aria-hidden="true">
          *
        </span>{" "}
        は必須項目です
      </p>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
        >
          メールアドレス
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="demo1@example.com"
          onChange={(event) => setEmail(event.target.value)}
          required
          aria-required="true"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
        >
          パスワード
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          autoComplete="current-password"
          placeholder="••••••••"
          onChange={(event) => setPassword(event.target.value)}
          required
          aria-required="true"
        />
      </div>
      {errorMessage ? (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {errorMessage}
        </p>
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
