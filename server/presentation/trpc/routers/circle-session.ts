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
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { publicProcedure, router } from "@/server/presentation/trpc/trpc";

export const circleSessionRouter = router({
  list: publicProcedure
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

  get: publicProcedure
    .input(circleSessionGetInputSchema)
    .output(circleSessionDtoSchema)
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const session = await ctx.circleSessionService.getCircleSession(
          ctx.actorId,
          input.circleSessionId,
        );
        if (!session) {
          throw new Error("CircleSession not found");
        }
        return toCircleSessionDto(session);
      }),
    ),

  create: publicProcedure
    .input(circleSessionCreateInputSchema)
    .output(circleSessionDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const session = await ctx.circleSessionService.createCircleSession({
          actorId: ctx.actorId,
          id: circleSessionId(randomUUID()),
          circleId: input.circleId,
          sequence: input.sequence,
          title: input.title,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          location: input.location,
          note: input.note,
        });
        return toCircleSessionDto(session);
      }),
    ),

  update: publicProcedure
    .input(circleSessionUpdateInputSchema)
    .output(circleSessionDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const session =
          await ctx.circleSessionService.updateCircleSessionDetails(
            ctx.actorId,
            input.circleSessionId,
            {
              sequence: input.sequence,
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

  delete: publicProcedure
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
