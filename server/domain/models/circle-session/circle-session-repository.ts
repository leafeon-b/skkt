import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import type {
  CircleId,
  CircleSessionId,
  UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";

export type CircleSessionRepository = {
  findById(id: CircleSessionId): Promise<CircleSession | null>;
  findByIds(ids: readonly CircleSessionId[]): Promise<CircleSession[]>;
  listByCircleId(circleId: CircleId): Promise<CircleSession[]>;
  save(session: CircleSession): Promise<void>;
  delete(id: CircleSessionId): Promise<void>;
  listMemberships(
    circleSessionId: CircleSessionId,
  ): Promise<CircleSessionMembership[]>;
  listMembershipsByUserId(
    userId: UserId,
  ): Promise<CircleSessionMembership[]>;
  addMembership(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void>;
  updateMembershipRole(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void>;
  areUsersParticipating(
    circleSessionId: CircleSessionId,
    userIds: readonly UserId[],
  ): Promise<boolean>;
  removeMembership(
    circleSessionId: CircleSessionId,
    userId: UserId,
  ): Promise<void>;
};
