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
import { CirclePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export function CircleCreateDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();
  const createCircle = trpc.circles.create.useMutation({
    onSuccess: (data) => {
      setOpen(false);
      setName("");
      router.push(`/circles/${encodeURIComponent(data.id)}`);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || createCircle.isPending) {
      return;
    }
    createCircle.mutate({ name: trimmed });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setName("");
      createCircle.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-(--brand-ink-muted) hover:text-(--brand-ink)"
          aria-label="研究会作成"
        >
          <CirclePlus className="size-4" />
          <span className="hidden sm:inline">研究会作成</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-(--brand-ink)">
            研究会を作成
          </DialogTitle>
          <DialogDescription className="sr-only">
            新しい研究会の名前を入力して作成します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <p className="mb-3 text-xs text-(--brand-ink-muted)">
            <span className="text-red-600" aria-hidden="true">
              *
            </span>{" "}
            は必須項目です
          </p>
          <label
            htmlFor="circle-name"
            className="block text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
          >
            研究会名
          </label>
          <Input
            id="circle-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="研究会名"
            aria-required="true"
            className="mt-2 bg-white"
          />
          {createCircle.error ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {createCircle.error.message}
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
              disabled={createCircle.isPending}
            >
              <CirclePlus className="size-4" />
              {createCircle.isPending ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
