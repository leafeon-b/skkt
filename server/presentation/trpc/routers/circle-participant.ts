import { z } from "zod";
import {
  circleParticipantCreateInputSchema,
  circleParticipantDtoSchema,
  circleParticipantListInputSchema,
  circleParticipantRemoveInputSchema,
  circleParticipantRoleUpdateInputSchema,
  circleTransferOwnershipInputSchema,
} from "@/server/presentation/dto/circle-participant";
import {
  toCircleParticipantDtos,
} from "@/server/presentation/mappers/circle-participant-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleParticipantRouter = router({
  list: publicProcedure
    .input(circleParticipantListInputSchema)
    .output(circleParticipantDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const participants = await ctx.circleParticipationService.listParticipants(
          {
            actorId: ctx.actorId,
            circleId: input.circleId,
          },
        );
        return toCircleParticipantDtos(participants);
      }),
    ),

  add: publicProcedure
    .input(circleParticipantCreateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.addParticipant({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  updateRole: publicProcedure
    .input(circleParticipantRoleUpdateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.changeParticipantRole({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  remove: publicProcedure
    .input(circleParticipantRemoveInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleParticipationService.removeParticipant({
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
