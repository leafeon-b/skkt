import { z } from "zod";
import {
  circleSessionParticipantCreateInputSchema,
  circleSessionParticipantDtoSchema,
  circleSessionParticipantListInputSchema,
  circleSessionParticipantRemoveInputSchema,
  circleSessionParticipantRoleUpdateInputSchema,
  circleSessionTransferOwnershipInputSchema,
} from "@/server/presentation/dto/circle-session-participant";
import {
  toCircleSessionParticipantDtos,
} from "@/server/presentation/mappers/circle-session-participant-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleSessionParticipantRouter = router({
  list: publicProcedure
    .input(circleSessionParticipantListInputSchema)
    .output(circleSessionParticipantDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const participants =
          await ctx.circleSessionParticipationService.listParticipants({
            actorId: ctx.actorId,
            circleSessionId: input.circleSessionId,
          });
        return toCircleSessionParticipantDtos(participants);
      }),
    ),

  add: publicProcedure
    .input(circleSessionParticipantCreateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionParticipationService.addParticipant({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  updateRole: publicProcedure
    .input(circleSessionParticipantRoleUpdateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionParticipationService.changeParticipantRole({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  remove: publicProcedure
    .input(circleSessionParticipantRemoveInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionParticipationService.removeParticipant({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          userId: input.userId,
        });
        return;
      }),
    ),

  transferOwnership: publicProcedure
    .input(circleSessionTransferOwnershipInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionParticipationService.transferOwnership({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
        });
        return;
      }),
    ),
});
