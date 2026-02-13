import type { CircleId, CircleSessionId } from "@/server/domain/common/ids";
import {
  assertMaxLength,
  assertNonEmpty,
  assertStartBeforeEnd,
  assertValidDate,
} from "@/server/domain/common/validation";

export type CircleSession = {
  id: CircleSessionId;
  circleId: CircleId;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  note: string;
  createdAt: Date;
};

export type CircleSessionCreateParams = {
  id: CircleSessionId;
  circleId: CircleId;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location?: string | null;
  note?: string;
  createdAt?: Date;
};

export const createCircleSession = (
  params: CircleSessionCreateParams,
): CircleSession => {
  const startsAt = assertValidDate(params.startsAt, "startsAt");
  const endsAt = assertValidDate(params.endsAt, "endsAt");
  assertStartBeforeEnd(startsAt, endsAt, "CircleSession");
  const title = assertMaxLength(
    assertNonEmpty(params.title, "CircleSession title"),
    100,
    "CircleSession title",
  );

  return {
    id: params.id,
    circleId: params.circleId,
    title,
    startsAt,
    endsAt,
    location: params.location ?? null,
    note: params.note?.trim() ?? "",
    createdAt: params.createdAt ?? new Date(),
  };
};

export const rescheduleCircleSession = (
  session: CircleSession,
  startsAt: Date,
  endsAt: Date,
): CircleSession => {
  const nextStartsAt = assertValidDate(startsAt, "startsAt");
  const nextEndsAt = assertValidDate(endsAt, "endsAt");
  assertStartBeforeEnd(nextStartsAt, nextEndsAt, "CircleSession");

  return {
    ...session,
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
  };
};
