import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { UnauthorizedError } from "@/server/domain/common/errors";
import { toTrpcError } from "@/server/presentation/trpc/errors";
import type { Context } from "@/server/presentation/trpc/context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.actorId === null) {
    throw toTrpcError(new UnauthorizedError());
  }
  return next({ ctx: { ...ctx, actorId: ctx.actorId } });
});
