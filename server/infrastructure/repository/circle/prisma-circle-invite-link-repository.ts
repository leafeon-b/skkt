import type { CircleInviteLinkRepository } from "@/server/domain/models/circle/circle-invite-link-repository";
import type { CircleId, InviteLinkToken } from "@/server/domain/common/ids";
import type { CircleInviteLink } from "@/server/domain/models/circle/circle-invite-link";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapCircleInviteLinkToDomain,
  mapCircleInviteLinkToPersistence,
} from "@/server/infrastructure/mappers/circle-invite-link-mapper";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const createPrismaCircleInviteLinkRepository = (
  client: PrismaClientLike,
): CircleInviteLinkRepository => ({
  async findByToken(token: InviteLinkToken): Promise<CircleInviteLink | null> {
    const found = await client.circleInviteLink.findUnique({
      where: { token },
    });

    return found ? mapCircleInviteLinkToDomain(found) : null;
  },

  async findActiveByCircleId(
    circleId: CircleId,
  ): Promise<CircleInviteLink | null> {
    // "Active" = not expired: expiresAt > now (consistent with domain isExpired: now >= expiresAt)
    // BR-011: At most one active link should exist. orderBy is defensive for race conditions.
    const found = await client.circleInviteLink.findFirst({
      where: {
        circleId: toPersistenceId(circleId),
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return found ? mapCircleInviteLinkToDomain(found) : null;
  },

  async save(link: CircleInviteLink): Promise<void> {
    const data = mapCircleInviteLinkToPersistence(link);

    await client.circleInviteLink.upsert({
      where: { id: data.id },
      update: {
        expiresAt: data.expiresAt,
      },
      create: data,
    });
  },
});

export const prismaCircleInviteLinkRepository =
  createPrismaCircleInviteLinkRepository(prisma);
