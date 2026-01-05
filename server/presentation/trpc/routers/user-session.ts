import {
  userSessionNextInputSchema,
  userSessionRecentInputSchema,
  userSessionSummaryDtoSchema,
} from "@/server/presentation/dto/user-session";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const userSessionRouter = router({
  recent: publicProcedure
    .input(userSessionRecentInputSchema)
    .output(userSessionSummaryDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        void ctx;
        void input;
        throw new Error("Not implemented");
      }),
    ),
  next: publicProcedure
    .input(userSessionNextInputSchema)
    .output(userSessionSummaryDtoSchema.nullable())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        void ctx;
        void input;
        throw new Error("Not implemented");
      }),
    ),
});
