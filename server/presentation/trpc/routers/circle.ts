import { randomUUID } from "crypto";
import { z } from "zod";
import { circleId } from "@/server/domain/common/ids";
import {
  circleCreateInputSchema,
  circleDeleteInputSchema,
  circleDtoSchema,
  circleGetInputSchema,
  circleRenameInputSchema,
} from "@/server/presentation/dto/circle";
import { circleParticipationRouter } from "@/server/presentation/trpc/routers/circle-participation";
import { circleInviteLinkRouter } from "@/server/presentation/trpc/routers/circle-invite-link";
import { toCircleDto } from "@/server/presentation/mappers/circle-mapper";
import { NotFoundError } from "@/server/domain/common/errors";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleRouter = router({
  get: protectedProcedure
    .input(circleGetInputSchema)
    .output(circleDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const circle = await ctx.circleService.getCircle(
          ctx.actorId,
          input.circleId,
        );
        if (!circle) {
          throw new NotFoundError("Circle");
        }
        return toCircleDto(circle);
      }),
    ),

  create: protectedProcedure
    .input(circleCreateInputSchema)
    .output(circleDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const circle = await ctx.circleService.createCircle({
          actorId: ctx.actorId,
          id: circleId(randomUUID()),
          name: input.name,
        });
        return toCircleDto(circle);
      }),
    ),

  rename: protectedProcedure
    .input(circleRenameInputSchema)
    .output(circleDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const circle = await ctx.circleService.renameCircle(
          ctx.actorId,
          input.circleId,
          input.name,
        );
        return toCircleDto(circle);
      }),
    ),

  delete: protectedProcedure
    .input(circleDeleteInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleService.deleteCircle(ctx.actorId, input.circleId);
        return;
      }),
    ),

  participations: circleParticipationRouter,
  inviteLinks: circleInviteLinkRouter,
});
