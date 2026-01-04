import type { CircleSessionRoleLink } from "@/app/(authenticated)/circle-sessions/components/circle-session-detail-view";
import type {
  CircleSessionDetailProvider,
  CircleSessionDetailProviderInput,
  CircleSessionDetailViewModel,
  CircleSessionMatchOutcome,
  CircleSessionRoleKey,
} from "@/server/presentation/view-models/circle-session-detail";

export const demoRoleLinks: CircleSessionRoleLink[] = [
  { role: "owner", label: "オーナー", href: "/circle-sessions/demo/owner" },
  {
    role: "manager",
    label: "マネージャー",
    href: "/circle-sessions/demo/manager",
  },
  { role: "member", label: "メンバー", href: "/circle-sessions/demo/member" },
];

const participants: CircleSessionDetailViewModel["participants"] = [
  { id: "p1", name: "藤井 聡太" },
  { id: "p2", name: "豊島 将之" },
  { id: "p3", name: "永瀬 拓矢" },
  { id: "p4", name: "佐々木 勇気" },
  { id: "p5", name: "伊藤 匠" },
  { id: "p6", name: "菅井 竜也" },
];

const matchSeeds: Array<{
  player1Id: string;
  player2Id: string;
  outcome: CircleSessionMatchOutcome;
}> = [
  { player1Id: "p1", player2Id: "p2", outcome: "P1_WIN" },
  { player1Id: "p2", player2Id: "p1", outcome: "P1_WIN" },
  { player1Id: "p1", player2Id: "p3", outcome: "P2_WIN" },
  { player1Id: "p1", player2Id: "p4", outcome: "DRAW" },
  { player1Id: "p2", player2Id: "p3", outcome: "P1_WIN" },
  { player1Id: "p2", player2Id: "p3", outcome: "P2_WIN" },
  { player1Id: "p3", player2Id: "p2", outcome: "P1_WIN" },
  { player1Id: "p2", player2Id: "p5", outcome: "P2_WIN" },
  { player1Id: "p3", player2Id: "p6", outcome: "P2_WIN" },
  { player1Id: "p4", player2Id: "p5", outcome: "P1_WIN" },
  { player1Id: "p4", player2Id: "p5", outcome: "DRAW" },
  { player1Id: "p5", player2Id: "p4", outcome: "P1_WIN" },
  { player1Id: "p5", player2Id: "p6", outcome: "DRAW" },
];

const baseDetail: Omit<CircleSessionDetailViewModel, "viewerRole"> = {
  circleSessionId: "demo-session-42",
  circleId: "demo",
  circleName: "京大将棋研究会",
  title: "第42回 週末研究会",
  dateTimeLabel: "2025/03/12 18:00 - 21:00",
  locationLabel: "オンライン",
  memoText: "進行表は開始10分前に共有",
  sessionDateInput: "2025-03-12",
  participants,
  matches: matchSeeds.map((match, index) => ({
    id: `match-${index + 1}`,
    ...match,
  })),
};

export const getDemoCircleSessionDetail = (input?: {
  viewerRole?: CircleSessionRoleKey | null;
}): CircleSessionDetailViewModel => ({
  ...baseDetail,
  viewerRole: input?.viewerRole ?? null,
});

export const createDemoCircleSessionDetailProvider = (
  viewerRole?: CircleSessionRoleKey | null
): CircleSessionDetailProvider => ({
  // _inputには実データを入れる予定
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDetail(_input: CircleSessionDetailProviderInput) {
    return getDemoCircleSessionDetail({ viewerRole });
  },
});
