import type { CircleInviteLink as PrismaCircleInviteLink } from "@/generated/prisma/client";
import {
  toCircleId,
  toCircleInviteLinkId,
  toInviteLinkToken,
  toUserId,
} from "@/server/domain/common/ids";
import { createCircleInviteLink } from "@/server/domain/models/circle-invite-link/circle-invite-link";
import type { CircleInviteLink } from "@/server/domain/models/circle-invite-link/circle-invite-link";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapCircleInviteLinkToDomain = (
  link: PrismaCircleInviteLink,
): CircleInviteLink =>
  createCircleInviteLink({
    id: toCircleInviteLinkId(link.id),
    circleId: toCircleId(link.circleId),
    token: toInviteLinkToken(link.token),
    createdByUserId: toUserId(link.createdByUserId),
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
