import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { Circle } from "@/server/domain/models/circle/circle";
import type { CircleMembership } from "@/server/domain/models/circle/circle-membership";
import type { CircleId, UserId } from "@/server/domain/common/ids";
import type { CircleRole } from "@/server/domain/models/circle/circle-role";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";

export type CircleStore = Map<string, Circle>;
export type CircleMembershipStore = Map<string, CircleMembership[]>;

export const createInMemoryCircleRepository = (
  circleStore: CircleStore = new Map(),
  membershipStore: CircleMembershipStore = new Map(),
): CircleRepository & {
  readonly _circleStore: CircleStore;
  readonly _membershipStore: CircleMembershipStore;
} => ({
  _circleStore: circleStore,
  _membershipStore: membershipStore,

  async findById(id: CircleId): Promise<Circle | null> {
    return circleStore.get(id) ?? null;
  },

  async findByIds(ids: readonly CircleId[]): Promise<Circle[]> {
    if (ids.length === 0) return [];
    const uniqueIds = Array.from(new Set(ids));
    return uniqueIds
      .map((id) => circleStore.get(id))
      .filter((c): c is Circle => c != null);
  },

  async save(circle: Circle): Promise<void> {
    circleStore.set(circle.id, { ...circle });
  },

  async delete(id: CircleId): Promise<void> {
    circleStore.delete(id);
  },

  async findMembershipByCircleAndUser(
    circleId: CircleId,
    userId: UserId,
  ): Promise<CircleMembership | null> {
    const all = membershipStore.get(circleId) ?? [];
    return all.find((m) => m.userId === userId && m.deletedAt === null) ?? null;
  },

  async listMembershipsByCircleId(
    circleId: CircleId,
  ): Promise<CircleMembership[]> {
    const all = membershipStore.get(circleId) ?? [];
    return all.filter((m) => m.deletedAt === null);
  },

  async listMembershipsByUserId(userId: UserId): Promise<CircleMembership[]> {
    const result: CircleMembership[] = [];
    for (const memberships of membershipStore.values()) {
      for (const m of memberships) {
        if (m.userId === userId && m.deletedAt === null) {
          result.push(m);
        }
      }
    }
    return result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  },

  async addMembership(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void> {
    const existing = membershipStore.get(circleId) ?? [];
    if (
      existing.some(
        (m) =>
          m.userId === userId &&
          m.circleId === circleId &&
          m.deletedAt === null,
      )
    ) {
      throw new ConflictError("Membership already exists");
    }
    const membership: CircleMembership = {
      circleId,
      userId,
      role,
      createdAt: new Date(),
      deletedAt: null,
    };
    membershipStore.set(circleId, [...existing, membership]);
  },

  async updateMembershipRole(
    circleId: CircleId,
    userId: UserId,
    role: CircleRole,
  ): Promise<void> {
    const memberships = membershipStore.get(circleId) ?? [];
    let found = false;
    const updated = memberships.map((m) => {
      if (m.userId === userId && m.deletedAt === null) {
        found = true;
        return { ...m, role };
      }
      return m;
    });
    if (!found) {
      throw new NotFoundError("CircleMembership");
    }
    membershipStore.set(circleId, updated);
  },

  async removeMembership(
    circleId: CircleId,
    userId: UserId,
    deletedAt: Date,
  ): Promise<void> {
    const memberships = membershipStore.get(circleId) ?? [];
    let found = false;
    const updated = memberships.map((m) => {
      if (m.userId === userId && m.deletedAt === null) {
        found = true;
        return { ...m, deletedAt };
      }
      return m;
    });
    if (!found) {
      throw new NotFoundError("CircleMembership");
    }
    membershipStore.set(circleId, updated);
  },
});
