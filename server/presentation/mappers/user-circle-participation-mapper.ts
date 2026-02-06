import type { UserCircleParticipation } from "@/server/application/circle/circle-participation-service";
import {
  userCircleParticipationDtoSchema,
  type UserCircleParticipationDto,
} from "@/server/presentation/dto/user-circle-participation";

export const toUserCircleParticipationDto = (
  participation: UserCircleParticipation,
): UserCircleParticipationDto =>
  userCircleParticipationDtoSchema.parse(participation);

export const toUserCircleParticipationDtos = (
  participations: UserCircleParticipation[],
): UserCircleParticipationDto[] =>
  participations.map(toUserCircleParticipationDto);
