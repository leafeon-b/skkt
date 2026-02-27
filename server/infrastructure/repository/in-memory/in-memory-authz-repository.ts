import type { AuthzRepository } from "@/server/domain/services/authz/authz-repository";
import type {
  CircleMembershipStatus,
  CircleSessionMembershipStatus,
} from "@/server/domain/services/authz/memberships";
import {
  circleMembershipStatusFromRole,
  circleSessionMembershipStatusFromRole,
} from "@/server/domain/services/authz/memberships";
import type { UserStore } from "./in-memory-user-repository";
import type { CircleMembershipStore } from "./in-memory-circle-repository";
import type { CircleSessionMembershipStore } from "./in-memory-circle-session-repository";

export const createInMemoryAuthzRepository = (deps: {
  userStore: UserStore;
  circleMembershipStore: CircleMembershipStore;
  circleSessionMembershipStore: CircleSessionMembershipStore;
}): AuthzRepository => ({
  async isRegisteredUser(userId: string): Promise<boolean> {
    return deps.userStore.has(userId);
  },

  async findCircleMembership(
    userId: string,
    circleId: string,
  ): Promise<CircleMembershipStatus> {
    const memberships = deps.circleMembershipStore.get(circleId) ?? [];
    const active = memberships.find(
      (m) => m.userId === userId && m.deletedAt === null,
    );
    return circleMembershipStatusFromRole(active?.role ?? null);
  },

  async findCircleSessionMembership(
    userId: string,
    circleSessionId: string,
  ): Promise<CircleSessionMembershipStatus> {
    const memberships =
      deps.circleSessionMembershipStore.get(circleSessionId) ?? [];
    const active = memberships.find(
      (m) => m.userId === userId && m.deletedAt === null,
    );
    return circleSessionMembershipStatusFromRole(active?.role ?? null);
  },
});
