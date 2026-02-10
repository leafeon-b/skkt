"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

type CircleSessionCreateFormProps = {
  circleId: string;
  defaultStartsAt?: string;
};

export function CircleSessionCreateForm({
  circleId,
  defaultStartsAt,
}: CircleSessionCreateFormProps) {
  const [sequence, setSequence] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(
    defaultStartsAt ? `${defaultStartsAt}T00:00` : "",
  );
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const createSession = trpc.circleSessions.create.useMutation();
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const seq = Number(sequence);
    const trimmedTitle = title.trim();
    if (!seq || !trimmedTitle || !startsAt || !endsAt || createSession.isPending) {
      return;
    }
    createSession.mutate({
      circleId,
      sequence: seq,
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
        className="flex w-full flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sequence"
              className="text-xs font-semibold text-(--brand-ink-muted)"
            >
              回数（第N回）
            </label>
            <Input
              id="sequence"
              type="number"
              min={1}
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              placeholder="1"
              required
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="title"
              className="text-xs font-semibold text-(--brand-ink-muted)"
            >
              タイトル
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="第1回 定例研究会"
              required
              className="bg-white"
            />
          </div>
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
              required
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
              required
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
          {createSession.isPending ? "作成中..." : "開催回を作成"}
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
