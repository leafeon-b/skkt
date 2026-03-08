import type { CircleId, CircleSessionId } from "@/server/domain/common/ids";
import {
  assertMaxLength,
  assertNonEmpty,
  assertStartBeforeEnd,
  assertValidDate,
} from "@/server/domain/common/validation";

export const CIRCLE_SESSION_TITLE_MAX_LENGTH = 100;
export const CIRCLE_SESSION_LOCATION_MAX_LENGTH = 100;
export const CIRCLE_SESSION_NOTE_MAX_LENGTH = 500;

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
    CIRCLE_SESSION_TITLE_MAX_LENGTH,
    "CircleSession title",
  );

  return {
    id: params.id,
    circleId: params.circleId,
    title,
    startsAt,
    endsAt,
    location: params.location
      ? assertMaxLength(
          params.location,
          CIRCLE_SESSION_LOCATION_MAX_LENGTH,
          "CircleSession location",
        )
      : null,
    note: assertMaxLength(
      params.note?.trim() ?? "",
      CIRCLE_SESSION_NOTE_MAX_LENGTH,
      "CircleSession note",
    ),
    createdAt: params.createdAt ?? new Date(),
  };
};

export const renameCircleSession = (
  session: CircleSession,
  title: string,
): CircleSession => ({
  ...session,
  title: assertMaxLength(
    assertNonEmpty(title, "CircleSession title"),
    CIRCLE_SESSION_TITLE_MAX_LENGTH,
    "CircleSession title",
  ),
});

export const updateCircleSessionNote = (
  session: CircleSession,
  note: string,
): CircleSession => ({
  ...session,
  note: assertMaxLength(
    note.trim(),
    CIRCLE_SESSION_NOTE_MAX_LENGTH,
    "CircleSession note",
  ),
});

export const updateCircleSessionLocation = (
  session: CircleSession,
  location: string | null,
): CircleSession => ({
  ...session,
  location: location
    ? assertMaxLength(
        location,
        CIRCLE_SESSION_LOCATION_MAX_LENGTH,
        "CircleSession location",
      )
    : null,
});

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
