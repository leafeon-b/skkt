import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleSessionMembership } from "@/server/domain/models/circle-session/circle-session-membership";
import type {
  CircleId,
  CircleSessionId,
  UserId,
} from "@/server/domain/common/ids";
import type { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";

export type CircleSessionStore = Map<string, CircleSession>;
export type CircleSessionMembershipStore = Map<
  string,
  CircleSessionMembership[]
>;

export const createInMemoryCircleSessionRepository = (
  sessionStore: CircleSessionStore = new Map(),
  membershipStore: CircleSessionMembershipStore = new Map(),
): CircleSessionRepository & {
  readonly _sessionStore: CircleSessionStore;
  readonly _membershipStore: CircleSessionMembershipStore;
} => ({
  _sessionStore: sessionStore,
  _membershipStore: membershipStore,

  async findById(id: CircleSessionId): Promise<CircleSession | null> {
    return sessionStore.get(id) ?? null;
  },

  async findByIds(ids: readonly CircleSessionId[]): Promise<CircleSession[]> {
    if (ids.length === 0) return [];
    const uniqueIds = Array.from(new Set(ids));
    return uniqueIds
      .map((id) => sessionStore.get(id))
      .filter((s): s is CircleSession => s != null);
  },

  async listByCircleId(circleId: CircleId): Promise<CircleSession[]> {
    const sessions: CircleSession[] = [];
    for (const session of sessionStore.values()) {
      if (session.circleId === circleId) {
        sessions.push(session);
      }
    }
    return sessions.sort((a, b) => {
      const startsAtDiff = a.startsAt.getTime() - b.startsAt.getTime();
      if (startsAtDiff !== 0) return startsAtDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  },

  async save(session: CircleSession): Promise<void> {
    sessionStore.set(session.id, { ...session });
  },

  async delete(id: CircleSessionId): Promise<void> {
    sessionStore.delete(id);
  },

  async listMemberships(
    circleSessionId: CircleSessionId,
  ): Promise<CircleSessionMembership[]> {
    const all = membershipStore.get(circleSessionId) ?? [];
    return all.filter((m) => m.deletedAt === null);
  },

  async listMembershipsByUserId(
    userId: UserId,
  ): Promise<CircleSessionMembership[]> {
    const result: CircleSessionMembership[] = [];
    for (const memberships of membershipStore.values()) {
      for (const m of memberships) {
        if (m.userId === userId && m.deletedAt === null) {
          result.push(m);
        }
      }
    }
    return result;
  },

  async addMembership(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void> {
    const existing = membershipStore.get(circleSessionId) ?? [];
    if (
      existing.some(
        (m) =>
          m.userId === userId &&
          m.circleSessionId === circleSessionId &&
          m.deletedAt === null,
      )
    ) {
      throw new ConflictError("Membership already exists");
    }
    const membership: CircleSessionMembership = {
      circleSessionId,
      userId,
      role,
      createdAt: new Date(),
      deletedAt: null,
    };
    membershipStore.set(circleSessionId, [...existing, membership]);
  },

  async updateMembershipRole(
    circleSessionId: CircleSessionId,
    userId: UserId,
    role: CircleSessionRole,
  ): Promise<void> {
    const memberships = membershipStore.get(circleSessionId) ?? [];
    let found = false;
    const updated = memberships.map((m) => {
      if (m.userId === userId && m.deletedAt === null) {
        found = true;
        return { ...m, role };
      }
      return m;
    });
    if (!found) {
      throw new NotFoundError("CircleSessionMembership");
    }
    membershipStore.set(circleSessionId, updated);
  },

  async areUsersSessionMembers(
    circleSessionId: CircleSessionId,
    userIds: readonly UserId[],
  ): Promise<boolean> {
    const uniqueIds = Array.from(new Set(userIds));
    if (uniqueIds.length === 0) return false;

    const memberships = membershipStore.get(circleSessionId) ?? [];
    const activeUserIds = new Set(
      memberships.filter((m) => m.deletedAt === null).map((m) => m.userId),
    );

    return uniqueIds.every((id) => activeUserIds.has(id));
  },

  async listDeletedMemberships(
    circleSessionId: CircleSessionId,
  ): Promise<CircleSessionMembership[]> {
    const all = membershipStore.get(circleSessionId) ?? [];
    return all.filter((m) => m.deletedAt !== null);
  },

  async removeMembership(
    circleSessionId: CircleSessionId,
    userId: UserId,
    deletedAt: Date,
  ): Promise<void> {
    const memberships = membershipStore.get(circleSessionId) ?? [];
    let found = false;
    const updated = memberships.map((m) => {
      if (m.userId === userId && m.deletedAt === null) {
        found = true;
        return { ...m, deletedAt };
      }
      return m;
    });
    if (!found) {
      throw new NotFoundError("CircleSessionMembership");
    }
    membershipStore.set(circleSessionId, updated);
  },
});
