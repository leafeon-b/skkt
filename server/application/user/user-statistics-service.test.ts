import { beforeEach, describe, expect, test } from "vitest";
import { createUserStatisticsService } from "@/server/application/user/user-statistics-service";
import {
  createInMemoryMatchRepository,
  createInMemoryUserRepository,
} from "@/server/infrastructure/repository/in-memory";
import type { UserStore } from "@/server/infrastructure/repository/in-memory/in-memory-user-repository";
import type { MatchStore } from "@/server/infrastructure/repository/in-memory/in-memory-match-repository";
import type { CircleStore } from "@/server/infrastructure/repository/in-memory/in-memory-circle-repository";
import type { CircleSessionStore } from "@/server/infrastructure/repository/in-memory/in-memory-circle-session-repository";
import {
  toCircleId,
  toCircleSessionId,
  toMatchId,
  toUserId,
} from "@/server/domain/common/ids";
import type { MatchOutcome } from "@/server/domain/models/match/match";

const matchStore: MatchStore = new Map();
const circleSessionStore: CircleSessionStore = new Map();
const circleStore: CircleStore = new Map();
const userStore: UserStore = new Map();

const matchRepository = createInMemoryMatchRepository(matchStore, {
  circleSessionStore,
  circleStore,
});
const userRepository = createInMemoryUserRepository(userStore);

const service = createUserStatisticsService({
  matchRepository,
  userRepository,
});

const TARGET_USER = toUserId("target-user");
const OPPONENT = toUserId("opponent");

const CIRCLE_A = toCircleId("circle-a");
const CIRCLE_B = toCircleId("circle-b");

const OPPONENT_B = toUserId("opponent-b");

let matchCounter = 0;

const ensureCircle = (cId: ReturnType<typeof toCircleId>, name: string) => {
  if (!circleStore.has(cId)) {
    circleStore.set(cId, { id: cId, name, createdAt: new Date(), sessionEmailNotificationEnabled: true });
  }
  const csId = toCircleSessionId(`session-for-${cId}`);
  if (!circleSessionStore.has(csId)) {
    circleSessionStore.set(csId, {
      id: csId,
      circleId: cId,
      title: "Session",
      startsAt: new Date(),
      endsAt: new Date(),
      location: null,
      note: "",
      createdAt: new Date(),
    });
  }
};

const addMatchWithCircle = (
  overrides: Partial<{
    player1Id: ReturnType<typeof toUserId>;
    player2Id: ReturnType<typeof toUserId>;
    outcome: MatchOutcome;
    circleId: ReturnType<typeof toCircleId>;
    circleName: string;
  }> = {},
) => {
  const cId = overrides.circleId ?? CIRCLE_A;
  const cName = overrides.circleName ?? "研究会A";
  ensureCircle(cId, cName);

  const csId = toCircleSessionId(`session-for-${cId}`);
  const mId = toMatchId(`match-${matchCounter++}`);
  matchStore.set(mId, {
    id: mId,
    circleSessionId: csId,
    createdAt: new Date(),
    player1Id: overrides.player1Id ?? TARGET_USER,
    player2Id: overrides.player2Id ?? OPPONENT,
    outcome: overrides.outcome ?? "UNKNOWN",
    deletedAt: null,
  });
};

const addMatch = (
  overrides: Partial<{
    player1Id: ReturnType<typeof toUserId>;
    player2Id: ReturnType<typeof toUserId>;
    outcome: MatchOutcome;
  }> = {},
) => {
  const csId = toCircleSessionId("session-1");
  if (!circleSessionStore.has(csId)) {
    const cId = toCircleId("default-circle");
    if (!circleStore.has(cId)) {
      circleStore.set(cId, { id: cId, name: "Default", createdAt: new Date(), sessionEmailNotificationEnabled: true });
    }
    circleSessionStore.set(csId, {
      id: csId,
      circleId: cId,
      title: "Session",
      startsAt: new Date(),
      endsAt: new Date(),
      location: null,
      note: "",
      createdAt: new Date(),
    });
  }
  const mId = toMatchId(`match-${matchCounter++}`);
  matchStore.set(mId, {
    id: mId,
    circleSessionId: csId,
    createdAt: new Date(),
    player1Id: overrides.player1Id ?? TARGET_USER,
    player2Id: overrides.player2Id ?? OPPONENT,
    outcome: overrides.outcome ?? "UNKNOWN",
    deletedAt: null,
  });
};

describe("UserStatisticsService", () => {
  beforeEach(() => {
    matchStore.clear();
    circleSessionStore.clear();
    circleStore.clear();
    userStore.clear();
    matchCounter = 0;
  });

  describe("getMatchStatisticsAll - total", () => {
    test("対局なしの場合、全て0を返す", async () => {
      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 0, draws: 0 });
    });

    test("player1として勝った場合、winsが1増える", async () => {
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P1_WIN",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 1, losses: 0, draws: 0 });
    });

    test("player1として負けた場合、lossesが1増える", async () => {
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P2_WIN",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 1, draws: 0 });
    });

    test("player2として勝った場合、winsが1増える", async () => {
      addMatchWithCircle({
        player1Id: OPPONENT,
        player2Id: TARGET_USER,
        outcome: "P2_WIN",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 1, losses: 0, draws: 0 });
    });

    test("player2として負けた場合、lossesが1増える", async () => {
      addMatchWithCircle({
        player1Id: OPPONENT,
        player2Id: TARGET_USER,
        outcome: "P1_WIN",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 1, draws: 0 });
    });

    test("引き分けの場合、drawsが1増える", async () => {
      addMatchWithCircle({ outcome: "DRAW" });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 0, draws: 1 });
    });

    test("UNKNOWNの対局は集計から除外される", async () => {
      addMatchWithCircle({ outcome: "UNKNOWN" });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 0, draws: 0 });
    });
  });

  describe("getMatchStatisticsAll - byCircle", () => {
    test("対局なしの場合、空配列を返す", async () => {
      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.byCircle).toEqual([]);
    });

    test("1つの研究会のみの場合、その研究会の統計を返す", async () => {
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P1_WIN",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P2_WIN",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.byCircle).toEqual([
        {
          circleId: CIRCLE_A,
          circleName: "研究会A",
          wins: 1,
          losses: 1,
          draws: 0,
        },
      ]);
    });

    test("複数の研究会にまたがる対局データで正しく集計される", async () => {
      // 研究会A: 勝ち
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P1_WIN",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });
      // 研究会A: 引き分け
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "DRAW",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });
      // 研究会B: 負け
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P2_WIN",
        circleId: CIRCLE_B,
        circleName: "研究会B",
      });
      // 研究会B: 勝ち
      addMatchWithCircle({
        player1Id: OPPONENT,
        player2Id: TARGET_USER,
        outcome: "P2_WIN",
        circleId: CIRCLE_B,
        circleName: "研究会B",
      });
      // 研究会A: UNKNOWN（除外）
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "UNKNOWN",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.byCircle).toEqual([
        {
          circleId: CIRCLE_A,
          circleName: "研究会A",
          wins: 1,
          losses: 0,
          draws: 1,
        },
        {
          circleId: CIRCLE_B,
          circleName: "研究会B",
          wins: 1,
          losses: 1,
          draws: 0,
        },
      ]);
    });
  });

  describe("getMatchStatisticsAll - byCircle ソート", () => {
    test("byCircleはcircleName昇順でソートされる", async () => {
      const CIRCLE_C = toCircleId("circle-c");

      // データは逆順（C → B → A）で登場
      addMatchWithCircle({
        outcome: "P1_WIN",
        circleId: CIRCLE_C,
        circleName: "研究会C",
      });
      addMatchWithCircle({
        outcome: "P1_WIN",
        circleId: CIRCLE_B,
        circleName: "研究会B",
      });
      addMatchWithCircle({
        outcome: "P1_WIN",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      // circleName昇順（A → B → C）で返される
      expect(result.byCircle.map((c) => c.circleName)).toEqual([
        "研究会A",
        "研究会B",
        "研究会C",
      ]);
    });
  });

  describe("getMatchStatisticsAll - 統合テスト", () => {
    test("トータルと研究会別が同時に正しく計算される", async () => {
      // 研究会A: 勝ち
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P1_WIN",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });
      // 研究会B: 負け
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P2_WIN",
        circleId: CIRCLE_B,
        circleName: "研究会B",
      });
      // 研究会A: 引き分け
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "DRAW",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });
      // UNKNOWN（除外）
      addMatchWithCircle({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "UNKNOWN",
        circleId: CIRCLE_A,
        circleName: "研究会A",
      });

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      // トータル: 勝ち1 + 負け1 + 引き分け1 = 3局（UNKNOWNは除外）
      expect(result.total).toEqual({ wins: 1, losses: 1, draws: 1 });

      // 研究会別（circleName昇順）
      expect(result.byCircle).toEqual([
        {
          circleId: CIRCLE_A,
          circleName: "研究会A",
          wins: 1,
          losses: 0,
          draws: 1,
        },
        {
          circleId: CIRCLE_B,
          circleName: "研究会B",
          wins: 0,
          losses: 1,
          draws: 0,
        },
      ]);
    });
  });

  describe("getOpponents", () => {
    test("対局なしの場合、空配列を返す", async () => {
      const result = await service.getOpponents(TARGET_USER);

      expect(result).toEqual([]);
    });

    test("対戦相手を名前付きで返す", async () => {
      addMatch({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P1_WIN",
      });
      addMatch({
        player1Id: TARGET_USER,
        player2Id: OPPONENT_B,
        outcome: "P1_WIN",
      });
      userStore.set(OPPONENT, {
        id: OPPONENT,
        name: "対戦相手A",
        email: null,
        image: null,
        hasCustomImage: false,
        profileVisibility: "PUBLIC",
        createdAt: new Date(),
        passwordHash: null,
        passwordChangedAt: null,
      });
      userStore.set(OPPONENT_B, {
        id: OPPONENT_B,
        name: "対戦相手B",
        email: null,
        image: null,
        hasCustomImage: false,
        profileVisibility: "PUBLIC",
        createdAt: new Date(),
        passwordHash: null,
        passwordChangedAt: null,
      });

      const result = await service.getOpponents(TARGET_USER);

      expect(result).toEqual([
        { userId: OPPONENT, name: "対戦相手A" },
        { userId: OPPONENT_B, name: "対戦相手B" },
      ]);
    });

    test("名前がnullのユーザーは「名前未設定」として返す", async () => {
      addMatch({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P1_WIN",
      });
      userStore.set(OPPONENT, {
        id: OPPONENT,
        name: null,
        email: null,
        image: null,
        hasCustomImage: false,
        profileVisibility: "PUBLIC",
        createdAt: new Date(),
        passwordHash: null,
        passwordChangedAt: null,
      });

      const result = await service.getOpponents(TARGET_USER);

      expect(result).toEqual([{ userId: OPPONENT, name: "名前未設定" }]);
    });
  });

  describe("getOpponentRecord", () => {
    test("対局なしの場合、全て0を返す", async () => {
      const result = await service.getOpponentRecord(TARGET_USER, OPPONENT);

      expect(result).toEqual({ wins: 0, losses: 0, draws: 0 });
    });

    test("勝敗引き分けを正しく集計する", async () => {
      addMatch({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P1_WIN",
      });
      addMatch({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "P2_WIN",
      });
      addMatch({
        player1Id: OPPONENT,
        player2Id: TARGET_USER,
        outcome: "P1_WIN",
      });
      addMatch({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "DRAW",
      });
      addMatch({
        player1Id: TARGET_USER,
        player2Id: OPPONENT,
        outcome: "UNKNOWN",
      });

      const result = await service.getOpponentRecord(TARGET_USER, OPPONENT);

      expect(result).toEqual({ wins: 1, losses: 2, draws: 1 });
    });
  });
});
