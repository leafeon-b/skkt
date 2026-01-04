import type { CircleSession } from "@/server/domain/models/circle-session/circle-session";
import {
  circleSessionDtoSchema,
  type CircleSessionDto,
} from "@/server/presentation/dto/circle-session";

export const toCircleSessionDto = (session: CircleSession): CircleSessionDto =>
  circleSessionDtoSchema.parse(session);

export const toCircleSessionDtos = (
  sessions: CircleSession[],
): CircleSessionDto[] => sessions.map(toCircleSessionDto);
