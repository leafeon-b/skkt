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
  createdAtInput: string;
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
  canCreateCircleSession: boolean;
  canDeleteCircleSession: boolean;
  canWithdrawFromCircleSession: boolean;
  participations: CircleSessionParticipation[];
  matches: CircleSessionMatch[];
};
