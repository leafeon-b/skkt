import { z } from "zod";
import {
  circleMembershipCreateInputSchema,
  circleMembershipDtoSchema,
  circleMembershipListInputSchema,
  circleMembershipRemoveInputSchema,
  circleMembershipRoleUpdateInputSchema,
  circleTransferOwnershipInputSchema,
  circleWithdrawInputSchema,
} from "@/server/presentation/dto/circle-membership";
import { toCircleMembershipDtos } from "@/server/presentation/mappers/circle-membership-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleMembershipRouter = router({
  list: protectedProcedure
    .input(circleMembershipListInputSchema)
    .output(circleMembershipDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const memberships = await ctx.circleMembershipService.listByCircleId({
          actorId: ctx.actorId,
          circleId: input.circleId,
        });
        return toCircleMembershipDtos(memberships);
      }),
    ),

  add: protectedProcedure
    .input(circleMembershipCreateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleMembershipService.addMembership({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  updateRole: protectedProcedure
    .input(circleMembershipRoleUpdateInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleMembershipService.changeMembershipRole({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
          role: input.role,
        });
        return;
      }),
    ),

  withdraw: protectedProcedure
    .input(circleWithdrawInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleMembershipService.withdrawMembership({
          actorId: ctx.actorId,
          circleId: input.circleId,
        });
        return;
      }),
    ),

  remove: protectedProcedure
    .input(circleMembershipRemoveInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleMembershipService.removeMembership({
          actorId: ctx.actorId,
          circleId: input.circleId,
          userId: input.userId,
        });
        return;
      }),
    ),

  transferOwnership: protectedProcedure
    .input(circleTransferOwnershipInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleMembershipService.transferOwnership({
          actorId: ctx.actorId,
          circleId: input.circleId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
        });
        return;
      }),
    ),
});
