import {
  userMembershipDtoSchema,
  userMembershipListInputSchema,
} from "@/server/presentation/dto/user-membership";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const userMembershipRouter = router({
  list: publicProcedure
    .input(userMembershipListInputSchema)
    .output(userMembershipDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        void ctx;
        void input;
        throw new Error("Not implemented");
      }),
    ),
});
