import type { CircleSessionId } from "../../common/ids";
import type { RoundRobinSchedule } from "./round-robin-schedule";

export type RoundRobinScheduleRepository = {
  findByCircleSessionId(
    circleSessionId: CircleSessionId,
  ): Promise<RoundRobinSchedule | null>;
  save(schedule: RoundRobinSchedule): Promise<void>;
  deleteByCircleSessionId(circleSessionId: CircleSessionId): Promise<void>;
};
