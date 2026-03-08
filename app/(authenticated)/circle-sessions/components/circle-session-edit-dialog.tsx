"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trimWithFullwidth } from "@/lib/string";
import { trpc } from "@/lib/trpc/client";
import {
  CIRCLE_SESSION_LOCATION_MAX_LENGTH,
  CIRCLE_SESSION_NOTE_MAX_LENGTH,
  CIRCLE_SESSION_TITLE_MAX_LENGTH,
} from "@/server/domain/models/circle-session/circle-session";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

type CircleSessionEditDialogProps = {
  circleSessionId: string;
  title: string;
  startsAtInput: string;
  endsAtInput: string;
  locationLabel: string | null;
  memoText: string | null;
};

export function CircleSessionEditDialog({
  circleSessionId,
  title: initialTitle,
  startsAtInput,
  endsAtInput,
  locationLabel,
  memoText,
}: CircleSessionEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [startsAt, setStartsAt] = useState(startsAtInput);
  const [endsAt, setEndsAt] = useState(endsAtInput);
  const [location, setLocation] = useState(locationLabel ?? "");
  const [note, setNote] = useState(memoText ?? "");
  const router = useRouter();

  const updateSession = trpc.circleSessions.update.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    e.target.setCustomValidity(
      trimWithFullwidth(value) === ""
        ? "タイトルを入力してください"
        : "",
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (updateSession.isPending) return;
    updateSession.mutate({
      circleSessionId,
      title: trimWithFullwidth(title),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      location: location.trim() || null,
      note: note.trim(),
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTitle(initialTitle);
      setStartsAt(startsAtInput);
      setEndsAt(endsAtInput);
      setLocation(locationLabel ?? "");
      setNote(memoText ?? "");
      updateSession.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-(--brand-ink)/20 bg-white/80 text-(--brand-ink) hover:bg-white"
        >
          <Pencil className="size-4" aria-hidden="true" />
          セッションを編集
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-(--brand-ink)">
            セッションを編集
          </DialogTitle>
          <DialogDescription className="sr-only">
            セッションの詳細情報を編集します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-title"
              className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
            >
              タイトル
            </label>
            <Input
              id="edit-title"
              value={title}
              onChange={handleTitleChange}
              maxLength={CIRCLE_SESSION_TITLE_MAX_LENGTH}
              required
              className="bg-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-startsAt"
                className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
              >
                開始日時
              </label>
              <Input
                id="edit-startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-endsAt"
                className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
              >
                終了日時
              </label>
              <Input
                id="edit-endsAt"
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
              htmlFor="edit-location"
              className="text-xs font-semibold text-(--brand-ink-muted)"
            >
              場所（任意）
            </label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: 将棋会館 3F"
              maxLength={CIRCLE_SESSION_LOCATION_MAX_LENGTH}
              className="bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-note"
              className="text-xs font-semibold text-(--brand-ink-muted)"
            >
              備考（任意）
            </label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={CIRCLE_SESSION_NOTE_MAX_LENGTH}
              rows={3}
              className="bg-white"
            />
          </div>

          {updateSession.error ? (
            <p role="alert" className="text-xs text-red-600">
              {updateSession.error.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-(--brand-ink)/20 bg-white/80 text-(--brand-ink)"
              onClick={() => handleOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
              disabled={updateSession.isPending}
            >
              {updateSession.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
