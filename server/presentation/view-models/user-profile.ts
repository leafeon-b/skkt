export type UserProfileViewModel = {
  userId: string;
  name: string;
  image: string | null;
  sessionParticipationCount: number;
  matchStatistics: {
    wins: number;
    losses: number;
    draws: number;
  };
};
