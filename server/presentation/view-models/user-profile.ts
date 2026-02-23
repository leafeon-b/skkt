export type UserProfileViewModel = {
  userId: string;
  name: string;
  image: string | null;
  isProfilePublic: boolean;
  sessionParticipationCount: number;
  matchStatistics: {
    wins: number;
    losses: number;
    draws: number;
  };
  circleMatchStatistics: {
    circleId: string;
    circleName: string;
    wins: number;
    losses: number;
    draws: number;
  }[];
};
