"use client";

import { useState } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type OpponentRecordSearchProps = {
  userId: string;
};

export function OpponentRecordSearch({ userId }: OpponentRecordSearchProps) {
  const [open, setOpen] = useState(false);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(
    null,
  );

  const opponentsQuery = trpc.users.statistics.opponents.useQuery({
    targetUserId: userId,
  });

  const recordQuery = trpc.users.statistics.opponentRecord.useQuery(
    { targetUserId: userId, opponentId: selectedOpponentId! },
    { enabled: selectedOpponentId !== null },
  );

  const opponents = opponentsQuery.data ?? [];
  const selectedOpponent = opponents.find(
    (o) => o.userId === selectedOpponentId,
  );

  return (
    <div className="flex flex-col gap-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedOpponent ? selectedOpponent.name : "対戦相手を選択..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="名前で検索..." />
            <CommandList>
              <CommandEmpty>対戦相手が見つかりません</CommandEmpty>
              <CommandGroup>
                {opponents.map((opponent) => (
                  <CommandItem
                    key={opponent.userId}
                    value={opponent.name}
                    onSelect={() => {
                      setSelectedOpponentId(
                        opponent.userId === selectedOpponentId
                          ? null
                          : opponent.userId,
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedOpponentId === opponent.userId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {opponent.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedOpponentId && (
        <div className="flex gap-6">
          {recordQuery.isLoading ? (
            <>
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-16" />
            </>
          ) : recordQuery.data ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-(--brand-moss)">
                  {recordQuery.data.wins}
                </span>
                <span className="text-sm text-muted-foreground">勝</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-(--brand-ink)">
                  {recordQuery.data.losses}
                </span>
                <span className="text-sm text-muted-foreground">敗</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-muted-foreground">
                  {recordQuery.data.draws}
                </span>
                <span className="text-sm text-muted-foreground">分</span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
