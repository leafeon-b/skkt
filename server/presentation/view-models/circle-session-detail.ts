export type CircleSessionRoleKey = "owner" | "manager" | "member";
export type CircleRoleKey = "owner" | "manager" | "member";
export type CircleSessionMatchOutcome =
  | "P1_WIN"
  | "P2_WIN"
  | "DRAW"
  | "UNKNOWN";

export type CircleSessionMembership = {
  id: string;
  name: string;
  role: CircleSessionRoleKey | null;
  canChangeRole: boolean;
  canRemoveMember: boolean;
};

export type CircleSessionMatch = {
  id: string;
  player1Id: string;
  player2Id: string;
  outcome: CircleSessionMatchOutcome;
  createdAtInput: string;
};

export type AddableMemberCandidate = {
  id: string;
  name: string;
};

export type RoundRobinPairingPlayer = {
  id: string;
  name: string;
};

export type RoundRobinPairingViewModel = {
  player1: RoundRobinPairingPlayer;
  player2: RoundRobinPairingPlayer;
};

export type RoundRobinRoundViewModel = {
  roundNumber: number;
  pairings: RoundRobinPairingViewModel[];
};

export type RoundRobinScheduleViewModel = {
  id: string;
  rounds: RoundRobinRoundViewModel[];
  totalMatchCount: number;
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
  viewerUserId: string | null;
  canCreateCircleSession: boolean;
  canEditCircleSession: boolean;
  canDeleteCircleSession: boolean;
  canWithdrawFromCircleSession: boolean;
  canAddCircleSessionMember: boolean;
  canTransferOwnership: boolean;
  canManageRoundRobinSchedule: boolean;
  addableMemberCandidates: AddableMemberCandidate[];
  memberships: CircleSessionMembership[];
  matches: CircleSessionMatch[];
  roundRobinSchedule: RoundRobinScheduleViewModel | null;
};
