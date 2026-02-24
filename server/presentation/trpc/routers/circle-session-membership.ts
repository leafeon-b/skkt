import { z } from "zod";
import {
  circleSessionMembershipCreateInputSchema,
  circleSessionMembershipDtoSchema,
  circleSessionMembershipListInputSchema,
  circleSessionMembershipRemoveInputSchema,
  circleSessionMembershipRoleUpdateInputSchema,
  circleSessionTransferOwnershipInputSchema,
  circleSessionWithdrawInputSchema,
} from "@/server/presentation/dto/circle-session-membership";
import { toCircleSessionMembershipDtos } from "@/server/presentation/mappers/circle-session-membership-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleSessionMembershipRouter = router({
  list: protectedProcedure
    .input(circleSessionMembershipListInputSchema)
    .output(circleSessionMembershipDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const memberships =
          await ctx.circleSessionMembershipService.listMemberships({
            actorId: ctx.actorId,
            circleSessionId: input.circleSessionId,
          });
        return toCircleSessionMembershipDtos(memberships);
      }),
    ),

  add: protectedProcedure
    .input(circleSessionMembershipCreateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionMembershipService.addMembership({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  updateRole: protectedProcedure
    .input(circleSessionMembershipRoleUpdateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionMembershipService.changeMembershipRole({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  withdraw: protectedProcedure
    .input(circleSessionWithdrawInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionMembershipService.withdrawMembership({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
        });
        return;
      }),
    ),

  remove: protectedProcedure
    .input(circleSessionMembershipRemoveInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionMembershipService.removeMembership({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          userId: input.userId,
        });
        return;
      }),
    ),

  transferOwnership: protectedProcedure
    .input(circleSessionTransferOwnershipInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionMembershipService.transferOwnership({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
        });
        return;
      }),
    ),
});
