import { appRouter } from "@/server/presentation/trpc/router";
import { createContext } from "@/server/presentation/trpc/context";
import type { AccountViewModel } from "@/server/presentation/view-models/account";

export async function getAccountViewModel(): Promise<AccountViewModel> {
  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);

  const [me, notificationPref] = await Promise.all([
    caller.users.me(),
    caller.notificationPreferences.get(),
  ]);

  return {
    name: me.name ?? "",
    email: me.email ?? "",
    image: me.image ?? null,
    hasPassword: me.hasPassword,
    profileVisibility: me.profileVisibility,
    emailEnabled: notificationPref.emailEnabled,
  };
}
