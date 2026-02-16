import { z } from "zod";
import {
  circleParticipationCreateInputSchema,
  circleParticipationDtoSchema,
  circleParticipationListInputSchema,
  circleParticipationRemoveInputSchema,
  circleParticipationRoleUpdateInputSchema,
  circleTransferOwnershipInputSchema,
  circleWithdrawInputSchema,
} from "@/server/presentation/dto/circle-participation";
import { toCircleParticipationDtos } from "@/server/presentation/mappers/circle-participation-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleParticipationRouter = router({
  list: publicProcedure
    .input(circleParticipationListInputSchema)
    .output(circleParticipationDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const participations =
          await ctx.circleParticipationService.listByCircleId({
            actorId: ctx.actorId,
            circleId: input.circleId,
          });
        return toCircleParticipationDtos(participations);
      }),
    ),

  add: publicProcedure
    .input(circleParticipationCreateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.addParticipation({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  updateRole: publicProcedure
    .input(circleParticipationRoleUpdateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.changeParticipationRole({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  withdraw: publicProcedure
    .input(circleWithdrawInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.withdrawParticipation({
          actorId: ctx.actorId,
          circleId: input.circleId,
        });
        return;
      }),
    ),

  remove: publicProcedure
    .input(circleParticipationRemoveInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.removeParticipation({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
        });
        return;
      }),
    ),

  transferOwnership: publicProcedure
    .input(circleTransferOwnershipInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.transferOwnership({
          actorId: ctx.actorId,
          circleId: input.circleId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
        });
        return;
      }),
    ),
});
