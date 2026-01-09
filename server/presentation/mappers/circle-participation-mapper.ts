import type { CircleParticipation } from "@/server/domain/models/circle/circle-participation";
import {
  circleParticipationDtoSchema,
  type CircleParticipationDto,
} from "@/server/presentation/dto/circle-participation";

export const toCircleParticipationDto = (
  participation: CircleParticipation,
): CircleParticipationDto => circleParticipationDtoSchema.parse(participation);

export const toCircleParticipationDtos = (
  participations: CircleParticipation[],
): CircleParticipationDto[] => participations.map(toCircleParticipationDto);
