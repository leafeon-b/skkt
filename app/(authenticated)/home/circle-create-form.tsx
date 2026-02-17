"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { CirclePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

export default function CircleCreateForm() {
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
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <p className="text-xs text-(--brand-ink-muted)">
          <span className="text-red-600" aria-hidden="true">
            *
          </span>{" "}
          は必須項目です
        </p>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="circle-name"
            className="text-xs font-semibold text-(--brand-ink-muted) after:ml-0.5 after:text-red-600 after:content-['*']"
          >
            研究会名
          </label>
          <Input
            id="circle-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="研究会名"
            aria-required="true"
            className="bg-white"
          />
        </div>
        <Button
          type="submit"
          className="bg-(--brand-moss) text-white hover:bg-(--brand-moss)/90"
          disabled={createCircle.isPending}
        >
          <CirclePlus />
          {createCircle.isPending ? "作成中..." : "研究会を作成"}
        </Button>
      </form>
      {created ? (
        <p className="mt-3 text-xs text-(--brand-ink-muted)">
          作成済み: {created.name} ({created.id})
        </p>
      ) : null}
      {createCircle.error ? (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {createCircle.error.message}
        </p>
      ) : null}
    </div>
  );
}
