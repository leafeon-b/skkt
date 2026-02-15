"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import { trimWithFullwidth } from "@/lib/string";
import { useRouter } from "next/navigation";

type CircleSessionCreateFormProps = {
  circleId: string;
  defaultStartsAt?: string;
  defaultTitle?: string;
  defaultEndsAt?: string;
  defaultLocation?: string;
  defaultNote?: string;
};

const DEFAULT_START_TIME = "10:00";
const DEFAULT_END_TIME = "18:00";

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDatetimeLocal(
  value: string | undefined,
  defaultTime: string,
  fallbackDate?: string,
): string {
  if (value && value.includes("T")) return value;
  const date = value || fallbackDate || getLocalDateString();
  return `${date}T${defaultTime}`;
}

export function CircleSessionCreateForm({
  circleId,
  defaultStartsAt,
  defaultTitle,
  defaultEndsAt,
  defaultLocation,
  defaultNote,
}: CircleSessionCreateFormProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [titleError, setTitleError] = useState("");
  const [startsAt, setStartsAt] = useState(() =>
    toDatetimeLocal(defaultStartsAt, DEFAULT_START_TIME),
  );
  const [endsAt, setEndsAt] = useState(() => {
    const startDate = toDatetimeLocal(
      defaultStartsAt,
      DEFAULT_START_TIME,
    ).slice(0, 10);
    return toDatetimeLocal(defaultEndsAt, DEFAULT_END_TIME, startDate);
  });
  const [location, setLocation] = useState(defaultLocation ?? "");
  const [note, setNote] = useState(defaultNote ?? "");

  const createSession = trpc.circleSessions.create.useMutation();
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = trimWithFullwidth(title);
    if (!trimmedTitle) {
      setTitleError("タイトルを入力してください");
      titleRef.current?.focus();
      return;
    }
    if (!startsAt || !endsAt || createSession.isPending) {
      return;
    }
    createSession.mutate({
      circleId,
      title: trimmedTitle,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      location: location.trim() || null,
      note: note.trim() || undefined,
    });
  };

  const created = createSession.data;

  useEffect(() => {
    if (!created?.id) {
      return;
    }
    router.push(`/circle-sessions/${encodeURIComponent(created.id)}`);
  }, [created?.id, router]);

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="title"
            className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
          >
            タイトル
          </label>
          <Input
            ref={titleRef}
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError("");
            }}
            placeholder="第1回 定例研究会"
            aria-required="true"
            aria-invalid={titleError ? "true" : undefined}
            aria-describedby={titleError ? "title-error" : undefined}
            className="bg-white"
          />
          {titleError && (
            <p id="title-error" className="text-xs text-red-600" role="alert">
              {titleError}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="startsAt"
              className="text-xs font-semibold text-(--brand-ink-muted)"
            >
              開始日時
            </label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              aria-required="true"
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="endsAt"
              className="text-xs font-semibold text-(--brand-ink-muted)"
            >
              終了日時
            </label>
            <Input
              id="endsAt"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              aria-required="true"
              className="bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="location"
            className="text-xs font-semibold text-(--brand-ink-muted)"
          >
            場所（任意）
          </label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 将棋会館 3F"
            className="bg-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="note"
            className="text-xs font-semibold text-(--brand-ink-muted)"
          >
            備考（任意）
          </label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="bg-white"
          />
        </div>

        <Button
          type="submit"
          className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
          disabled={createSession.isPending}
        >
          <Plus className="size-4" />
          {createSession.isPending ? "作成中..." : "予定を作成"}
        </Button>
      </form>
      {createSession.error ? (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {createSession.error.message}
        </p>
      ) : null}
    </div>
  );
}
