type Brand<K, T> = K & { readonly __brand: T };

export type UserId = Brand<string, "UserId">;
export type CircleId = Brand<string, "CircleId">;
export type CircleSessionId = Brand<string, "CircleSessionId">;
export type MatchId = Brand<string, "MatchId">;
export type MatchHistoryId = Brand<string, "MatchHistoryId">;
export type CircleInviteLinkId = Brand<string, "CircleInviteLinkId">;

export const userId = (value: string): UserId => value as UserId;
export const circleId = (value: string): CircleId => value as CircleId;
export const circleSessionId = (value: string): CircleSessionId =>
  value as CircleSessionId;
export const matchId = (value: string): MatchId => value as MatchId;
export const matchHistoryId = (value: string): MatchHistoryId =>
  value as MatchHistoryId;
export const circleInviteLinkId = (value: string): CircleInviteLinkId =>
  value as CircleInviteLinkId;
