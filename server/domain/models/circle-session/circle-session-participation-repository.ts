import type {
  CircleSessionId,
  UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";
import type { CircleSessionRole } from "@/server/domain/services/authz/roles";

export type CircleSessionParticipationRepository = {
  listParticipations(
    circleSessionId: CircleSessionId,
  ): Promise<CircleSessionParticipation[]>;
  listByUserId(userId: UserId): Promise<CircleSessionParticipation[]>;
  addParticipation(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void>;
  updateParticipationRole(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void>;
  areUsersParticipating(
    circleSessionId: CircleSessionId,
    userIds: readonly UserId[],
  ): Promise<boolean>;
  removeParticipation(
    circleSessionId: CircleSessionId,
    userId: UserId,
  ): Promise<void>;
};
