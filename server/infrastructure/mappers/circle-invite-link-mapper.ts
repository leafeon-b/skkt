import type { CircleInviteLink as PrismaCircleInviteLink } from "@/generated/prisma/client";
import {
  circleId,
  circleInviteLinkId,
  userId,
} from "@/server/domain/common/ids";
import { createCircleInviteLink } from "@/server/domain/models/circle/circle-invite-link";
import type { CircleInviteLink } from "@/server/domain/models/circle/circle-invite-link";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapCircleInviteLinkToDomain = (
  link: PrismaCircleInviteLink,
): CircleInviteLink =>
  createCircleInviteLink({
    id: circleInviteLinkId(link.id),
    circleId: circleId(link.circleId),
    token: link.token,
    createdByUserId: userId(link.createdByUserId),
    expiresAt: link.expiresAt,
    createdAt: link.createdAt,
  });

export const mapCircleInviteLinkToPersistence = (link: CircleInviteLink) => ({
  id: toPersistenceId(link.id),
  circleId: toPersistenceId(link.circleId),
  token: link.token,
  createdByUserId: toPersistenceId(link.createdByUserId),
  expiresAt: link.expiresAt,
  createdAt: link.createdAt,
});
