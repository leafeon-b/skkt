import type { CircleSession as PrismaCircleSession } from "@/generated/prisma/client";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import { circleId, circleSessionId } from "@/server/domain/common/ids";

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
  id: session.id as string,
  circleId: session.circleId as string,
  sequence: session.sequence,
  title: session.title,
  startsAt: session.startsAt,
  endsAt: session.endsAt,
  location: session.location,
  note: session.note,
  createdAt: session.createdAt,
});
