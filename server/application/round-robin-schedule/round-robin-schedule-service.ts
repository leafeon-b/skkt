import type {
  CircleId,
  CircleSessionId,
  UserId,
} from "@/server/domain/common/ids";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import { createRoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { RoundRobinScheduleRepository } from "@/server/domain/models/round-robin-schedule/round-robin-schedule-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import { ForbiddenError, NotFoundError } from "@/server/domain/common/errors";
import { roundRobinScheduleId } from "@/server/domain/common/ids";

type AccessService = ReturnType<typeof createAccessService>;

export type RoundRobinScheduleServiceDeps = {
  roundRobinScheduleRepository: RoundRobinScheduleRepository;
  circleSessionRepository: CircleSessionRepository;
  accessService: AccessService;
};

export const createRoundRobinScheduleService = (
  deps: RoundRobinScheduleServiceDeps,
) => {
  return {
    async generateSchedule(params: {
      actorId: UserId;
      circleSessionId: CircleSessionId;
    }): Promise<RoundRobinSchedule> {
      const session = await deps.circleSessionRepository.findById(
        params.circleSessionId,
      );
      if (!session) {
        throw new NotFoundError("CircleSession");
      }

      const allowed = await deps.accessService.canManageRoundRobinSchedule(
        params.actorId as string,
        params.circleSessionId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      const memberships = await deps.circleSessionRepository.listMemberships(
        params.circleSessionId,
      );
      const participantIds = memberships.map((m) => m.userId);

      // 既存スケジュールを削除
      await deps.roundRobinScheduleRepository.deleteByCircleSessionId(
        params.circleSessionId,
      );

      const id = roundRobinScheduleId(crypto.randomUUID());
      // createRoundRobinSchedule 内で参加者が2人未満の場合 BadRequestError が発生
      const schedule = createRoundRobinSchedule({
        id,
        circleSessionId: params.circleSessionId,
        participantIds,
      });

      await deps.roundRobinScheduleRepository.save(schedule);
      return schedule;
    },

    async getSchedule(params: {
      actorId: UserId;
      circleId: CircleId;
      circleSessionId: CircleSessionId;
    }): Promise<RoundRobinSchedule | null> {
      const allowed = await deps.accessService.canViewRoundRobinSchedule(
        params.actorId as string,
        params.circleId as string,
        params.circleSessionId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      return deps.roundRobinScheduleRepository.findByCircleSessionId(
        params.circleSessionId,
      );
    },

    async deleteSchedule(params: {
      actorId: UserId;
      circleSessionId: CircleSessionId;
    }): Promise<void> {
      const allowed = await deps.accessService.canManageRoundRobinSchedule(
        params.actorId as string,
        params.circleSessionId as string,
      );
      if (!allowed) {
        throw new ForbiddenError();
      }

      await deps.roundRobinScheduleRepository.deleteByCircleSessionId(
        params.circleSessionId,
      );
    },
  };
};
