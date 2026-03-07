import type { CircleId } from "@/server/domain/common/ids";
import {
  assertMaxLength,
  assertNonEmpty,
} from "@/server/domain/common/validation";

export const CIRCLE_NAME_MAX_LENGTH = 50;

export type Circle = {
  id: CircleId;
  name: string;
  createdAt: Date;
  sessionEmailNotificationEnabled: boolean;
};

export type CircleCreateParams = {
  id: CircleId;
  name: string;
  createdAt?: Date;
  sessionEmailNotificationEnabled?: boolean;
};

export const createCircle = (params: CircleCreateParams): Circle => ({
  id: params.id,
  name: assertMaxLength(
    assertNonEmpty(params.name, "Circle name"),
    CIRCLE_NAME_MAX_LENGTH,
    "Circle name",
  ),
  createdAt: params.createdAt ?? new Date(),
  sessionEmailNotificationEnabled:
    params.sessionEmailNotificationEnabled ?? true,
});

export const renameCircle = (circle: Circle, name: string): Circle => ({
  ...circle,
  name: assertMaxLength(
    assertNonEmpty(name, "Circle name"),
    CIRCLE_NAME_MAX_LENGTH,
    "Circle name",
  ),
});
