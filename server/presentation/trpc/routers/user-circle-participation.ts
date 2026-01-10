import { userId } from "@/server/domain/common/ids";
import {
  userCircleParticipationDtoSchema,
  userCircleParticipationListInputSchema,
} from "@/server/presentation/dto/user-circle-participation";
import { toUserCircleParticipationDtos } from "@/server/presentation/mappers/user-circle-participation-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const userCircleParticipationRouter = router({
  list: publicProcedure
    .input(userCircleParticipationListInputSchema)
    .output(userCircleParticipationDtoSchema.array())
    .query(({ ctx }) =>
      handleTrpcError(async () => {
        const participations =
          await ctx.circleParticipationService.listByUserId({
            actorId: ctx.actorId,
            userId: userId(ctx.actorId),
          });
        return toUserCircleParticipationDtos(participations);
      }),
    ),
});
