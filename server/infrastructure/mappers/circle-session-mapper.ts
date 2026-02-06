import type { CircleSession as PrismaCircleSession } from "@/generated/prisma/client";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import { circleId, circleSessionId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapCircleSessionToDomain = (
  session: PrismaCircleSession,
): CircleSession =>
  createCircleSession({
    id: circleSessionId(session.id),
    circleId: circleId(session.circleId),
    sequence: session.sequence,
    title: session.title,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    location: session.location,
    note: session.note,
    createdAt: session.createdAt,
  });

export const mapCircleSessionToPersistence = (session: CircleSession) => ({
  id: toPersistenceId(session.id),
  circleId: toPersistenceId(session.circleId),
  sequence: session.sequence,
  title: session.title,
  startsAt: session.startsAt,
  endsAt: session.endsAt,
  location: session.location,
  note: session.note,
  createdAt: session.createdAt,
});
