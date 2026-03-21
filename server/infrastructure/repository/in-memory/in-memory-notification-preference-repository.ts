import type { NotificationPreferenceRepository } from "@/server/domain/models/notification-preference/notification-preference-repository";
import type { NotificationPreference } from "@/server/domain/models/notification-preference/notification-preference";
import type { UserId } from "@/server/domain/common/ids";

export type NotificationPreferenceStore = Map<string, NotificationPreference>;

export const createInMemoryNotificationPreferenceRepository = (
  store: NotificationPreferenceStore = new Map(),
): NotificationPreferenceRepository & {
  readonly _store: NotificationPreferenceStore;
  _clear(): void;
} => ({
  _store: store,

  _clear() {
    store.clear();
  },

  async findByUserId(userId: UserId): Promise<NotificationPreference | null> {
    return store.get(userId) ?? null;
  },

  async findByUserIds(
    userIds: readonly UserId[],
  ): Promise<NotificationPreference[]> {
    const result: NotificationPreference[] = [];
    for (const pref of store.values()) {
      if (userIds.includes(pref.userId)) {
        result.push(pref);
      }
    }
    return result;
  },

  async save(pref: NotificationPreference): Promise<void> {
    store.set(pref.userId, { ...pref });
  },
});
