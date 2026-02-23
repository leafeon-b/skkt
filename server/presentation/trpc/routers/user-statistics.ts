import {
  opponentDtoSchema,
  opponentRecordDtoSchema,
  opponentRecordInputSchema,
  opponentsInputSchema,
} from "@/server/presentation/dto/user";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const userStatisticsRouter = router({
  opponents: protectedProcedure
    .input(opponentsInputSchema)
    .output(opponentDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const opponents = await ctx.userStatisticsService.getOpponents(
          input.targetUserId,
        );
        return opponents.map((o) => ({
          userId: o.userId as string,
          name: o.name,
        }));
      }),
    ),

  opponentRecord: protectedProcedure
    .input(opponentRecordInputSchema)
    .output(opponentRecordDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        return ctx.userStatisticsService.getOpponentRecord(
          input.targetUserId,
          input.opponentId,
        );
      }),
    ),
});
