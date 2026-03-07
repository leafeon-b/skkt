import type { NotificationPreferenceRepository } from "@/server/domain/models/notification-preference/notification-preference-repository";
import type { NotificationPreference } from "@/server/domain/models/notification-preference/notification-preference";
import type { UserId } from "@/server/domain/common/ids";
import { toUserId } from "@/server/domain/common/ids";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";

const toDomain = (row: {
  userId: string;
  emailEnabled: boolean;
}): NotificationPreference => ({
  userId: toUserId(row.userId),
  emailEnabled: row.emailEnabled,
});

export const createPrismaNotificationPreferenceRepository = (
  client: PrismaClientLike,
): NotificationPreferenceRepository => ({
  async findByUserId(uid: UserId): Promise<NotificationPreference | null> {
    const found = await client.notificationPreference.findUnique({
      where: { userId: toPersistenceId(uid) },
      select: { userId: true, emailEnabled: true },
    });
    return found ? toDomain(found) : null;
  },

  async findByUserIds(
    userIds: readonly UserId[],
  ): Promise<NotificationPreference[]> {
    if (userIds.length === 0) return [];
    const rows = await client.notificationPreference.findMany({
      where: { userId: { in: toPersistenceIds(userIds) } },
      select: { userId: true, emailEnabled: true },
    });
    return rows.map(toDomain);
  },

  async save(pref: NotificationPreference): Promise<void> {
    const uid = toPersistenceId(pref.userId);
    await client.notificationPreference.upsert({
      where: { userId: uid },
      create: { userId: uid, emailEnabled: pref.emailEnabled },
      update: { emailEnabled: pref.emailEnabled },
    });
  },
});

export const prismaNotificationPreferenceRepository =
  createPrismaNotificationPreferenceRepository(prisma);
