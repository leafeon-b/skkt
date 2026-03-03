import {
  userCircleSessionMembershipListInputSchema,
  userCircleSessionMembershipSummaryDtoSchema,
} from "@/server/presentation/dto/user-circle-session-membership";
import { toUserCircleSessionMembershipSummaryDtos } from "@/server/presentation/mappers/user-circle-session-membership-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const userCircleSessionMembershipRouter = router({
  list: protectedProcedure
    .input(userCircleSessionMembershipListInputSchema)
    .output(userCircleSessionMembershipSummaryDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const summaries = await ctx.circleSessionMembershipService.listByUserId(
          {
            actorId: ctx.actorId,
            userId: ctx.actorId,
            limit: input.limit,
          },
        );
        return toUserCircleSessionMembershipSummaryDtos(summaries);
      }),
    ),
});
