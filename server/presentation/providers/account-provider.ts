import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type { AccountViewModel } from "@/server/presentation/view-models/account";

export async function getAccountViewModel(): Promise<AccountViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const me = await caller.users.me();

  return {
    name: me.name ?? "",
    email: me.email ?? "",
    hasPassword: me.hasPassword,
  };
}
