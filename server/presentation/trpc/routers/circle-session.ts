import { randomUUID } from "crypto";
import { z } from "zod";
import { circleSessionId } from "@/server/domain/common/ids";
import {
  circleSessionCreateInputSchema,
  circleSessionDeleteInputSchema,
  circleSessionDtoSchema,
  circleSessionGetInputSchema,
  circleSessionListInputSchema,
  circleSessionUpdateInputSchema,
} from "@/server/presentation/dto/circle-session";
import {
  toCircleSessionDto,
  toCircleSessionDtos,
} from "@/server/presentation/mappers/circle-session-mapper";
import { circleSessionParticipationRouter } from "@/server/presentation/trpc/routers/circle-session-participation";
import { NotFoundError } from "@/server/domain/common/errors";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleSessionRouter = router({
  list: protectedProcedure
    .input(circleSessionListInputSchema)
    .output(circleSessionDtoSchema.array())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const sessions = await ctx.circleSessionService.listByCircleId(
          ctx.actorId,
          input.circleId,
        );
        return toCircleSessionDtos(sessions);
      }),
    ),

  get: protectedProcedure
    .input(circleSessionGetInputSchema)
    .output(circleSessionDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const session = await ctx.circleSessionService.getCircleSession(
          ctx.actorId,
          input.circleSessionId,
        );
        if (!session) {
          throw new NotFoundError("CircleSession");
        }
        return toCircleSessionDto(session);
      }),
    ),

  create: protectedProcedure
    .input(circleSessionCreateInputSchema)
    .output(circleSessionDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const session = await ctx.circleSessionService.createCircleSession({
          actorId: ctx.actorId,
          id: circleSessionId(randomUUID()),
          circleId: input.circleId,
          title: input.title,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          location: input.location,
          note: input.note,
        });
        return toCircleSessionDto(session);
      }),
    ),

  update: protectedProcedure
    .input(circleSessionUpdateInputSchema)
    .output(circleSessionDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const session =
          await ctx.circleSessionService.updateCircleSessionDetails(
            ctx.actorId,
            input.circleSessionId,
            {
              title: input.title,
              startsAt: input.startsAt,
              endsAt: input.endsAt,
              location: input.location,
              note: input.note,
            },
          );
        return toCircleSessionDto(session);
      }),
    ),

  delete: protectedProcedure
    .input(circleSessionDeleteInputSchema)
    .output(z.void())
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.circleSessionService.deleteCircleSession(
          ctx.actorId,
          input.circleSessionId,
        );
        return;
      }),
    ),

  participations: circleSessionParticipationRouter,
});
