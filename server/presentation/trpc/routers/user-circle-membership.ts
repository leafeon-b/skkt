import {
  userCircleMembershipDtoSchema,
  userCircleMembershipListInputSchema,
} from "@/server/presentation/dto/user-circle-membership";
import { toUserCircleMembershipDtos } from "@/server/presentation/mappers/user-circle-membership-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const userCircleMembershipRouter = router({
  list: protectedProcedure
    .input(userCircleMembershipListInputSchema)
    .output(userCircleMembershipDtoSchema.array())
    .query(({ ctx }) =>
      handleTrpcError(async () => {
        const memberships = await ctx.circleMembershipService.listByUserId({
          actorId: ctx.actorId,
          userId: ctx.actorId,
        });
        return toUserCircleMembershipDtos(memberships);
      }),
    ),
});
