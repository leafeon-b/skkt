import type { CircleSessionParticipation } from "@/server/domain/models/circle-session/circle-session-participation";
import {
  circleSessionParticipationDtoSchema,
  type CircleSessionParticipationDto,
} from "@/server/presentation/dto/circle-session-participation";

export const toCircleSessionParticipationDto = (
  participation: CircleSessionParticipation,
): CircleSessionParticipationDto =>
  circleSessionParticipationDtoSchema.parse(participation);

export const toCircleSessionParticipationDtos = (
  participations: CircleSessionParticipation[],
): CircleSessionParticipationDto[] =>
  participations.map(toCircleSessionParticipationDto);
