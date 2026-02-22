import { beforeEach, describe, expect, test, vi } from "vitest";
import { createUserStatisticsService } from "@/server/application/user/user-statistics-service";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import {
  circleId,
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import type { MatchOutcome } from "@/server/domain/models/match/match";
import type { MatchWithCircle } from "@/server/domain/models/match/match-read-models";

const matchRepository = {
  findById: vi.fn(),
  listByCircleSessionId: vi.fn(),
  listByUserId: vi.fn(),
  listByUserIdWithCircle: vi.fn(),
  save: vi.fn(),
} satisfies MatchRepository;

const service = createUserStatisticsService({ matchRepository });

const TARGET_USER = userId("target-user");
const OPPONENT = userId("opponent");

const CIRCLE_A = circleId("circle-a");
const CIRCLE_B = circleId("circle-b");

const createTestMatchWithCircle = (
  overrides: Partial<{
    player1Id: ReturnType<typeof userId>;
    player2Id: ReturnType<typeof userId>;
    outcome: MatchOutcome;
    circleId: ReturnType<typeof circleId>;
    circleName: string;
  }> = {},
): MatchWithCircle => ({
  id: matchId(`match-${Math.random()}`),
  circleSessionId: circleSessionId("session-1"),
  createdAt: new Date(),
  player1Id: overrides.player1Id ?? TARGET_USER,
  player2Id: overrides.player2Id ?? OPPONENT,
  outcome: overrides.outcome ?? "UNKNOWN",
  deletedAt: null,
  circleId: overrides.circleId ?? CIRCLE_A,
  circleName: overrides.circleName ?? "研究会A",
});

describe("UserStatisticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMatchStatisticsAll - total", () => {
    test("対局なしの場合、全て0を返す", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 0, draws: 0 });
      expect(
        matchRepository.listByUserIdWithCircle,
      ).toHaveBeenCalledWith(TARGET_USER);
    });

    test("player1として勝った場合、winsが1増える", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P1_WIN",
        }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 1, losses: 0, draws: 0 });
    });

    test("player1として負けた場合、lossesが1増える", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P2_WIN",
        }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 1, draws: 0 });
    });

    test("player2として勝った場合、winsが1増える", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        createTestMatchWithCircle({
          player1Id: OPPONENT,
          player2Id: TARGET_USER,
          outcome: "P2_WIN",
        }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 1, losses: 0, draws: 0 });
    });

    test("player2として負けた場合、lossesが1増える", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        createTestMatchWithCircle({
          player1Id: OPPONENT,
          player2Id: TARGET_USER,
          outcome: "P1_WIN",
        }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 1, draws: 0 });
    });

    test("引き分けの場合、drawsが1増える", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        createTestMatchWithCircle({ outcome: "DRAW" }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 0, draws: 1 });
    });

    test("UNKNOWNの対局は集計から除外される", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        createTestMatchWithCircle({ outcome: "UNKNOWN" }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.total).toEqual({ wins: 0, losses: 0, draws: 0 });
    });
  });

  describe("getMatchStatisticsAll - byCircle", () => {
    test("対局なしの場合、空配列を返す", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.byCircle).toEqual([]);
    });

    test("1つの研究会のみの場合、その研究会の統計を返す", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P1_WIN",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P2_WIN",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
      ]);

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
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        // 研究会A: 勝ち
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P1_WIN",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
        // 研究会A: 引き分け
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "DRAW",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
        // 研究会B: 負け
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P2_WIN",
          circleId: CIRCLE_B,
          circleName: "研究会B",
        }),
        // 研究会B: 勝ち
        createTestMatchWithCircle({
          player1Id: OPPONENT,
          player2Id: TARGET_USER,
          outcome: "P2_WIN",
          circleId: CIRCLE_B,
          circleName: "研究会B",
        }),
        // 研究会A: UNKNOWN（除外）
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "UNKNOWN",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      expect(result.byCircle).toEqual(
        expect.arrayContaining([
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
        ]),
      );
      expect(result.byCircle).toHaveLength(2);
    });
  });

  describe("getMatchStatisticsAll - 統合テスト", () => {
    test("トータルと研究会別が同時に正しく計算される", async () => {
      matchRepository.listByUserIdWithCircle.mockResolvedValue([
        // 研究会A: 勝ち
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P1_WIN",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
        // 研究会B: 負け
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P2_WIN",
          circleId: CIRCLE_B,
          circleName: "研究会B",
        }),
        // 研究会A: 引き分け
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "DRAW",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
        // UNKNOWN（除外）
        createTestMatchWithCircle({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "UNKNOWN",
          circleId: CIRCLE_A,
          circleName: "研究会A",
        }),
      ]);

      const result = await service.getMatchStatisticsAll(TARGET_USER);

      // トータル: 勝ち1 + 負け1 + 引き分け1 = 3局（UNKNOWNは除外）
      expect(result.total).toEqual({ wins: 1, losses: 1, draws: 1 });

      // 研究会別
      expect(result.byCircle).toEqual(
        expect.arrayContaining([
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
        ]),
      );
      expect(result.byCircle).toHaveLength(2);

      // DBクエリは1回のみ
      expect(
        matchRepository.listByUserIdWithCircle,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
