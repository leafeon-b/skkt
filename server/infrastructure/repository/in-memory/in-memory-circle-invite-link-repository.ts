import type { CircleInviteLinkRepository } from "@/server/domain/models/circle-invite-link/circle-invite-link-repository";
import type { CircleInviteLink } from "@/server/domain/models/circle-invite-link/circle-invite-link";
import type { CircleId, InviteLinkToken } from "@/server/domain/common/ids";

export type CircleInviteLinkStore = Map<string, CircleInviteLink>;

export const createInMemoryCircleInviteLinkRepository = (
  store: CircleInviteLinkStore = new Map(),
): CircleInviteLinkRepository & {
  readonly _store: CircleInviteLinkStore;
} => ({
  _store: store,

  async findByToken(
    token: InviteLinkToken,
  ): Promise<CircleInviteLink | null> {
    for (const link of store.values()) {
      if (link.token === token) {
        return link;
      }
    }
    return null;
  },

  async findActiveByCircleId(
    circleId: CircleId,
  ): Promise<CircleInviteLink | null> {
    const now = new Date();
    const active: CircleInviteLink[] = [];
    for (const link of store.values()) {
      if (link.circleId === circleId && link.expiresAt > now) {
        active.push(link);
      }
    }
    if (active.length === 0) return null;
    // Defensive: sort by createdAt desc, return first (most recent)
    active.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return active[0];
  },

  async save(link: CircleInviteLink): Promise<void> {
    store.set(link.id, { ...link });
  },
});
