import type { CircleSession as PrismaCircleSession } from "@/generated/prisma/client";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import { toCircleId, toCircleSessionId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapCircleSessionToDomain = (
  session: PrismaCircleSession,
): CircleSession =>
  createCircleSession({
    id: toCircleSessionId(session.id),
    circleId: toCircleId(session.circleId),
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
  title: session.title,
  startsAt: session.startsAt,
  endsAt: session.endsAt,
  location: session.location,
  note: session.note,
  createdAt: session.createdAt,
});
