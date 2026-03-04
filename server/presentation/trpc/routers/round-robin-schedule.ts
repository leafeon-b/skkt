import type { UserId } from "@/server/domain/common/ids";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { User } from "@/server/domain/models/user/user";
import {
  roundRobinScheduleDeleteInputSchema,
  roundRobinScheduleDtoSchema,
  roundRobinScheduleGenerateInputSchema,
  roundRobinScheduleGetInputSchema,
} from "@/server/presentation/dto/round-robin-schedule";
import { toRoundRobinScheduleDto } from "@/server/presentation/mappers/round-robin-schedule-mapper";
import { handleTrpcError } from "@/server/presentation/trpc/errors";
import { protectedProcedure, router } from "@/server/presentation/trpc/trpc";

const collectPlayerIds = (schedule: RoundRobinSchedule): UserId[] => {
  const ids = new Set<UserId>();
  for (const round of schedule.rounds) {
    for (const pairing of round.pairings) {
      ids.add(pairing.player1Id);
      ids.add(pairing.player2Id);
    }
  }
  return [...ids];
};

const fetchUserMap = async (
  listUsers: (actorId: string, ids: readonly UserId[]) => Promise<User[]>,
  actorId: string,
  playerIds: UserId[],
): Promise<Map<string, User>> => {
  const users = await listUsers(actorId, playerIds);
  return new Map(users.map((u) => [u.id as string, u]));
};

export const roundRobinScheduleRouter = router({
  get: protectedProcedure
    .input(roundRobinScheduleGetInputSchema)
    .output(roundRobinScheduleDtoSchema.nullable())
    .query(({ ctx, input }) =>
      handleTrpcError(async () => {
        const schedule = await ctx.roundRobinScheduleService.getSchedule({
          actorId: ctx.actorId,
          circleId: input.circleId,
          circleSessionId: input.circleSessionId,
        });
        if (!schedule) return null;

        const playerIds = collectPlayerIds(schedule);
        const userMap = await fetchUserMap(
          ctx.userService.listUsers,
          ctx.actorId as string,
          playerIds,
        );
        return toRoundRobinScheduleDto(schedule, userMap);
      }),
    ),

  generate: protectedProcedure
    .input(roundRobinScheduleGenerateInputSchema)
    .output(roundRobinScheduleDtoSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        const schedule =
          await ctx.roundRobinScheduleService.generateSchedule({
            actorId: ctx.actorId,
            circleSessionId: input.circleSessionId,
          });

        const playerIds = collectPlayerIds(schedule);
        const userMap = await fetchUserMap(
          ctx.userService.listUsers,
          ctx.actorId as string,
          playerIds,
        );
        return toRoundRobinScheduleDto(schedule, userMap);
      }),
    ),

  delete: protectedProcedure
    .input(roundRobinScheduleDeleteInputSchema)
    .mutation(({ ctx, input }) =>
      handleTrpcError(async () => {
        await ctx.roundRobinScheduleService.deleteSchedule({
          actorId: ctx.actorId,
          circleSessionId: input.circleSessionId,
        });
      }),
    ),
});
