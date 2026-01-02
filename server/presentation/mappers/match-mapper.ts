import type { Match } from "@/server/domain/models/match/match";
import {
  matchDtoSchema,
  type MatchDto,
} from "@/server/presentation/dto/match";

export const toMatchDto = (match: Match): MatchDto =>
  matchDtoSchema.parse(match);

export const toMatchDtos = (matches: Match[]): MatchDto[] =>
  matches.map(toMatchDto);
