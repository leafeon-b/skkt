export type CircleSessionRoleKey = "owner" | "manager" | "member";
export type CircleRoleKey = "owner" | "manager" | "member";
export type CircleSessionMatchOutcome =
  | "P1_WIN"
  | "P2_WIN"
  | "DRAW"
  | "UNKNOWN";

export type CircleSessionParticipation = {
  id: string;
  name: string;
};

export type CircleSessionMatch = {
  id: string;
  player1Id: string;
  player2Id: string;
  outcome: CircleSessionMatchOutcome;
};

export type CircleSessionDetailViewModel = {
  circleSessionId: string;
  circleId: string;
  circleName: string;
  title: string;
  dateTimeLabel: string;
  locationLabel: string | null;
  memoText: string | null;
  sessionDateInput: string;
  startsAtInput: string;
  endsAtInput: string;
  viewerRole: CircleSessionRoleKey | null;
  viewerCircleRole: CircleRoleKey | null;
  participations: CircleSessionParticipation[];
  matches: CircleSessionMatch[];
};

export type CircleSessionDetailProviderInput = {
  circleSessionId: string;
  viewerId: string | null;
};

export type CircleSessionDetailProvider = {
  getDetail(
    input: CircleSessionDetailProviderInput,
  ): Promise<CircleSessionDetailViewModel>;
};
