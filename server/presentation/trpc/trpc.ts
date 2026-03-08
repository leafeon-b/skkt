import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/server/domain/common/errors";
import { toTrpcError } from "@/server/presentation/trpc/errors";
import type { Context } from "@/server/presentation/trpc/context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isValidationError = error.cause instanceof ZodError;
    return {
      ...shape,
      message: isValidationError ? "Validation failed" : shape.message,
      data: {
        ...shape.data,
        isValidationError: isValidationError || undefined,
        retryAfterMs:
          error.cause != null &&
          typeof error.cause === "object" &&
          "retryAfterMs" in error.cause &&
          typeof error.cause.retryAfterMs === "number"
            ? error.cause.retryAfterMs
            : undefined,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.actorId === null) {
    throw toTrpcError(new UnauthorizedError());
  }
  return next({ ctx: { ...ctx, actorId: ctx.actorId } });
});
