import type { CircleId } from "@/server/domain/common/ids";

export type UserMatchStatistics = {
  wins: number;
  losses: number;
  draws: number;
};

export type CircleMatchStatistics = {
  circleId: CircleId;
  circleName: string;
  wins: number;
  losses: number;
  draws: number;
};
