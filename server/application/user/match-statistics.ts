import type { CircleId } from "@/server/domain/common/ids";

export type { UserMatchStatistics } from "@/server/domain/models/match/match-statistics";

export type CircleMatchStatistics = {
  circleId: CircleId;
  circleName: string;
  wins: number;
  losses: number;
  draws: number;
};
