import type {
  CircleId,
  CircleInviteLinkId,
  InviteLinkToken,
  UserId,
} from "@/server/domain/common/ids";

export type CircleInviteLink = {
  id: CircleInviteLinkId;
  circleId: CircleId;
  token: InviteLinkToken;
  createdByUserId: UserId;
  expiresAt: Date;
  createdAt: Date;
};

export type CircleInviteLinkCreateParams = {
  id: CircleInviteLinkId;
  circleId: CircleId;
  token: InviteLinkToken;
  createdByUserId: UserId;
  expiresAt: Date;
  createdAt?: Date;
};

export const createCircleInviteLink = (
  params: CircleInviteLinkCreateParams,
): CircleInviteLink => ({
  id: params.id,
  circleId: params.circleId,
  token: params.token,
  createdByUserId: params.createdByUserId,
  expiresAt: params.expiresAt,
  createdAt: params.createdAt ?? new Date(),
});

export const isExpired = (link: CircleInviteLink, now?: Date): boolean =>
  (now ?? new Date()) >= link.expiresAt;
