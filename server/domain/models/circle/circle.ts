import type { CircleId } from "@/server/domain/common/ids";
import {
  assertMaxLength,
  assertNonEmpty,
} from "@/server/domain/common/validation";

export type Circle = {
  id: CircleId;
  name: string;
  createdAt: Date;
};

export type CircleCreateParams = {
  id: CircleId;
  name: string;
  createdAt?: Date;
};

export const createCircle = (params: CircleCreateParams): Circle => ({
  id: params.id,
  name: assertMaxLength(
    assertNonEmpty(params.name, "Circle name"),
    50,
    "Circle name",
  ),
  createdAt: params.createdAt ?? new Date(),
});

export const renameCircle = (circle: Circle, name: string): Circle => ({
  ...circle,
  name: assertMaxLength(
    assertNonEmpty(name, "Circle name"),
    50,
    "Circle name",
  ),
});
