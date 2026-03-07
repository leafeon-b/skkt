"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  token: string;
};

type State = "idle" | "loading" | "success" | "error";

export function UnsubscribeForm({ token }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    setState("loading");
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();

      if (response.ok) {
        setState("success");
      } else {
        setState("error");
        setErrorMessage(data.message || "配信停止の処理中にエラーが発生しました。");
      }
    } catch {
      setState("error");
      setErrorMessage("配信停止の処理中にエラーが発生しました。");
    }
  }

  if (state === "success") {
    return (
      <>
        <h1 className="mb-4 text-xl font-bold text-(--brand-ink)">
          配信停止完了
        </h1>
        <p className="mb-6 text-sm text-(--brand-ink-muted)">
          メール配信を停止しました。今後、通知メールは届きません。
        </p>
        <p className="text-sm text-(--brand-ink-muted)">
          設定を変更したい場合は、
          <Link
            href="/account"
            className="text-(--brand-moss) underline hover:opacity-80"
          >
            ログインしてアカウント設定
          </Link>
          から変更できます。
        </p>
      </>
    );
  }

  if (state === "error") {
    return (
      <>
        <h1 className="mb-4 text-xl font-bold text-(--brand-ink)">
          配信停止
        </h1>
        <p className="mb-6 text-sm text-red-600">{errorMessage}</p>
        <p className="text-sm text-(--brand-ink-muted)">
          問題が解決しない場合は、
          <Link
            href="/account"
            className="text-(--brand-moss) underline hover:opacity-80"
          >
            ログインしてアカウント設定
          </Link>
          からメール通知を無効にしてください。
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-4 text-xl font-bold text-(--brand-ink)">
        配信停止
      </h1>
      <p className="mb-6 text-sm text-(--brand-ink-muted)">
        メール通知の配信を停止しますか？
      </p>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={state === "loading"}
        className="w-full rounded-lg bg-(--brand-moss) px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {state === "loading" ? "処理中..." : "配信を停止する"}
      </button>
    </>
  );
}
