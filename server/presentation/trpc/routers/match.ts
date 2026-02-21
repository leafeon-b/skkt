import { randomUUID } from "crypto";
import { NotFoundError } from "@/server/domain/common/errors";
import { matchId } from "@/server/domain/common/ids";
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
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const matchRouter = router({
  list: protectedProcedure
    .input(matchListInputSchema)
    .output(matchDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const matches = await ctx.matchService.listByCircleSessionId({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
        });
        return toMatchDtos(matches);
      }),
    ),

  get: protectedProcedure
    .input(matchGetInputSchema)
    .output(matchDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.getMatch({
          actorId: ctx.actorId,
          id: input.matchId,
        });
        if (!match) {
          throw new NotFoundError("Match");
        }
        return toMatchDto(match);
      }),
    ),

  create: protectedProcedure
    .input(matchCreateInputSchema)
    .output(matchDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.recordMatch({
          actorId: ctx.actorId,
          id: matchId(randomUUID()),
          circleSessionId: input.circleSessionId,
          player1Id: input.player1Id,
          player2Id: input.player2Id,
          outcome: input.outcome,
        });
        return toMatchDto(match);
      }),
    ),

  update: protectedProcedure
    .input(matchUpdateInputSchema)
    .output(matchDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.updateMatch({
          actorId: ctx.actorId,
          id: input.matchId,
          player1Id: input.player1Id,
          player2Id: input.player2Id,
          outcome: input.outcome,
        });
        return toMatchDto(match);
      }),
    ),

  delete: protectedProcedure
    .input(matchDeleteInputSchema)
    .output(matchDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const match = await ctx.matchService.deleteMatch({
          actorId: ctx.actorId,
          id: input.matchId,
        });
        return toMatchDto(match);
      }),
    ),

  history: matchHistoryRouter,
});
