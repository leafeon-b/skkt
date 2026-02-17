"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { sanitizeCallbackUrl } from "@/lib/url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD_LENGTH = 8;

type SignupFormProps = {
  callbackUrl?: string;
};

export default function SignupForm({ callbackUrl }: SignupFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("パスワードが一致しません。");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`,
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() ? name.trim() : undefined,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setErrorMessage(payload?.message ?? "登録に失敗しました。");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl ?? "/home",
      });

      if (!result || result.error) {
        setErrorMessage("登録は完了しましたが、ログインに失敗しました。");
        return;
      }

      router.push(sanitizeCallbackUrl(result.url ?? callbackUrl));
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
          htmlFor="display-name"
          className="text-xs font-semibold text-(--brand-ink-muted)"
        >
          表示名（任意）
        </label>
        <Input
          id="display-name"
          type="text"
          value={name}
          autoComplete="name"
          placeholder="例: 佐藤 太郎"
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="signup-email"
          className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
        >
          メールアドレス
        </label>
        <Input
          id="signup-email"
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
          htmlFor="signup-password"
          className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
        >
          パスワード
        </label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          autoComplete="new-password"
          placeholder="••••••••"
          onChange={(event) => setPassword(event.target.value)}
          required
          aria-required="true"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="signup-password-confirm"
          className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
        >
          パスワード（確認）
        </label>
        <Input
          id="signup-password-confirm"
          type="password"
          value={passwordConfirm}
          autoComplete="new-password"
          placeholder="••••••••"
          onChange={(event) => setPasswordConfirm(event.target.value)}
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
        アカウントを作成
      </Button>
    </form>
  );
}
