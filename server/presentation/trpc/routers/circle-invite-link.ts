import {
  circleInviteLinkCreateInputSchema,
  circleInviteLinkDtoSchema,
  circleInviteLinkInfoDtoSchema,
  circleInviteLinkInfoInputSchema,
  circleInviteLinkRedeemInputSchema,
  circleInviteLinkRedeemResultDtoSchema,
} from "@/server/presentation/dto/circle-invite-link";
import {
  toCircleInviteLinkDto,
  toCircleInviteLinkInfoDto,
} from "@/server/presentation/mappers/circle-invite-link-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleInviteLinkRouter = router({
  create: publicProcedure
    .input(circleInviteLinkCreateInputSchema)
    .output(circleInviteLinkDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const link = await ctx.circleInviteLinkService.createInviteLink({
          actorId: ctx.actorId,
          circleId: input.circleId,
          expiryDays: input.expiryDays,
        });
        return toCircleInviteLinkDto(link);
      }),
    ),

  getInfo: publicProcedure
    .input(circleInviteLinkInfoInputSchema)
    .output(circleInviteLinkInfoDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const info = await ctx.circleInviteLinkService.getInviteLinkInfo({
          token: input.token,
        });
        return toCircleInviteLinkInfoDto(info);
      }),
    ),

  redeem: publicProcedure
    .input(circleInviteLinkRedeemInputSchema)
    .output(circleInviteLinkRedeemResultDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const result = await ctx.circleInviteLinkService.redeemInviteLink({
          actorId: ctx.actorId,
          token: input.token,
        });
        return {
          circleId: result.circleId,
          alreadyMember: result.alreadyMember,
        };
      }),
    ),
});
