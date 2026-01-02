"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

export default function CircleCreateDemo() {
  const [name, setName] = useState("");
  const createCircle = trpc.circles.create.useMutation();
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || createCircle.isPending) {
      return;
    }
    createCircle.mutate({ name: trimmed });
  };

  const created = createCircle.data;

  useEffect(() => {
    if (!created?.id) {
      return;
    }
    router.push(`/circles/${encodeURIComponent(created.id)}`);
  }, [created?.id, router]);

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 sm:flex-row"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="研究会名"
          className="bg-white"
        />
        <Button
          type="submit"
          className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
          disabled={createCircle.isPending}
        >
          <CirclePlus />
          {createCircle.isPending ? "作成中..." : "研究会を新規作成"}
        </Button>
      </form>
      {created ? (
        <p className="mt-3 text-xs text-(--brand-ink-muted)">
          作成済み: {created.name} ({created.id})
        </p>
      ) : null}
      {createCircle.error ? (
        <p className="mt-3 text-xs text-red-600">
          {createCircle.error.message}
        </p>
      ) : null}
    </div>
  );
}
