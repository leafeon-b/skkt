import { randomUUID } from "crypto";
import { matchId, userId } from "@/server/domain/common/ids";
import {
  matchCreateInputSchema,
  matchDeleteInputSchema,
  matchDtoSchema,
  matchGetInputSchema,
  matchListInputSchema,
  matchUpdateInputSchema,
} from "@/server/presentation/dto/match";
import {
  toMatchDto,
  toMatchDtos,
} from "@/server/presentation/mappers/match-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { matchHistoryRouter } from "@/server/presentation/trpc/routers/match-history";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const matchRouter = router({
  list: publicProcedure
    .input(matchListInputSchema)
    .output(matchDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const matches = await ctx.matchService.listByCircleSessionId({
          actorId: userId(ctx.actorId),
          circleSessionId: input.circleSessionId,
        });
        return toMatchDtos(matches);
      }),
    ),

  get: publicProcedure
    .input(matchGetInputSchema)
    .output(matchDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.getMatch({
          actorId: userId(ctx.actorId),
          id: input.matchId,
        });
        if (!match) {
          throw new Error("Match not found");
        }
        return toMatchDto(match);
      }),
    ),

  create: publicProcedure
    .input(matchCreateInputSchema)
    .output(matchDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.recordMatch({
          actorId: userId(ctx.actorId),
          id: matchId(randomUUID()),
          circleSessionId: input.circleSessionId,
          player1Id: input.player1Id,
          player2Id: input.player2Id,
          outcome: input.outcome,
        });
        return toMatchDto(match);
      }),
    ),

  update: publicProcedure
    .input(matchUpdateInputSchema)
    .output(matchDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.updateMatch({
          actorId: userId(ctx.actorId),
          id: input.matchId,
          player1Id: input.player1Id,
          player2Id: input.player2Id,
          outcome: input.outcome,
        });
        return toMatchDto(match);
      }),
    ),

  delete: publicProcedure
    .input(matchDeleteInputSchema)
    .output(matchDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.deleteMatch({
          actorId: userId(ctx.actorId),
          id: input.matchId,
        });
        return toMatchDto(match);
      }),
    ),

  history: matchHistoryRouter,
});
