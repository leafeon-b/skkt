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
import { trpc } from "@/lib/trpc/client";
import { CIRCLE_NAME_MAX_LENGTH } from "@/server/domain/models/circle/circle";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

type CircleRenameDialogProps = {
  circleId: string;
  circleName: string;
};

export function CircleRenameDialog({
  circleId,
  circleName,
}: CircleRenameDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(circleName);
  const router = useRouter();
  const renameCircle = trpc.circles.rename.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed !== circleName && !renameCircle.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    renameCircle.mutate({ circleId, name: trimmed });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setName(circleName);
      renameCircle.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-(--brand-ink-muted) hover:text-(--brand-ink)"
          aria-label="研究会名を変更"
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-(--brand-ink)">
            研究会名を変更
          </DialogTitle>
          <DialogDescription className="sr-only">
            研究会の名前を変更します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="circle-rename"
            className="block text-xs font-semibold text-(--brand-ink-muted)"
          >
            研究会名
          </label>
          <Input
            id="circle-rename"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="研究会名"
            maxLength={CIRCLE_NAME_MAX_LENGTH}
            aria-required="true"
            className="mt-2 bg-white"
          />
          <p
            className={`mt-1 text-right text-xs ${
              name.length >= CIRCLE_NAME_MAX_LENGTH
                ? "text-destructive"
                : name.length >= CIRCLE_NAME_MAX_LENGTH * 0.8
                  ? "text-amber-600"
                  : "text-(--brand-ink-muted)"
            }`}
            aria-live={
              name.length >= CIRCLE_NAME_MAX_LENGTH * 0.8 ? "polite" : "off"
            }
            aria-label="研究会名の文字数"
          >
            {name.length} / {CIRCLE_NAME_MAX_LENGTH}
          </p>
          {renameCircle.error ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {renameCircle.error.message}
            </p>
          ) : null}
          <DialogFooter className="mt-6">
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
              disabled={!canSubmit}
            >
              {renameCircle.isPending ? "変更中..." : "変更"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
