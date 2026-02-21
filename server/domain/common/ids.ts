import { BadRequestError } from "./errors";

type Brand<K, T> = K & { readonly __brand: T };

export type UserId = Brand<string, "UserId">;
export type CircleId = Brand<string, "CircleId">;
export type CircleSessionId = Brand<string, "CircleSessionId">;
export type MatchId = Brand<string, "MatchId">;
export type MatchHistoryId = Brand<string, "MatchHistoryId">;
export type CircleInviteLinkId = Brand<string, "CircleInviteLinkId">;
export type InviteLinkToken = Brand<string, "InviteLinkToken">;

export const userId = (value: string): UserId => {
  if (!value) throw new BadRequestError("Invalid user ID");
  return value as UserId;
};
export const circleId = (value: string): CircleId => {
  if (!value) throw new BadRequestError("Invalid circle ID");
  return value as CircleId;
};
export const circleSessionId = (value: string): CircleSessionId => {
  if (!value) throw new BadRequestError("Invalid circle session ID");
  return value as CircleSessionId;
};
export const matchId = (value: string): MatchId => {
  if (!value) throw new BadRequestError("Invalid match ID");
  return value as MatchId;
};
export const matchHistoryId = (value: string): MatchHistoryId => {
  if (!value) throw new BadRequestError("Invalid match history ID");
  return value as MatchHistoryId;
};
export const circleInviteLinkId = (value: string): CircleInviteLinkId => {
  if (!value) throw new BadRequestError("Invalid circle invite link ID");
  return value as CircleInviteLinkId;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const inviteLinkToken = (value: string): InviteLinkToken => {
  if (!UUID_RE.test(value))
    throw new BadRequestError("Invalid invite link token");
  return value as InviteLinkToken;
};
