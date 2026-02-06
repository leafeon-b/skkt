import type { Circle as PrismaCircle } from "@/generated/prisma/client";
import { createCircle } from "@/server/domain/models/circle/circle";
import type { Circle } from "@/server/domain/models/circle/circle";
import { circleId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapCircleToDomain = (circle: PrismaCircle): Circle =>
  createCircle({
    id: circleId(circle.id),
    name: circle.name,
    createdAt: circle.createdAt,
  });

export const mapCircleToPersistence = (circle: Circle) => ({
  id: toPersistenceId(circle.id),
  name: circle.name,
  createdAt: circle.createdAt,
});
