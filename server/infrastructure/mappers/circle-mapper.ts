import type { Circle as PrismaCircle } from "@/generated/prisma/client";
import { createCircle } from "@/server/domain/models/circle/circle";
import type { Circle } from "@/server/domain/models/circle/circle";
import { toCircleId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapCircleToDomain = (circle: PrismaCircle): Circle =>
  createCircle({
    id: toCircleId(circle.id),
    name: circle.name,
    createdAt: circle.createdAt,
    sessionEmailNotificationEnabled: circle.sessionEmailNotificationEnabled,
  });

export const mapCircleToPersistence = (circle: Circle) => ({
  id: toPersistenceId(circle.id),
  name: circle.name,
  createdAt: circle.createdAt,
  sessionEmailNotificationEnabled: circle.sessionEmailNotificationEnabled,
});
