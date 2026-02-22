import { beforeEach, describe, expect, test, vi } from "vitest";
import { createUserStatisticsService } from "@/server/application/user/user-statistics-service";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import {
  circleId,
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import type {
  Match,
  MatchOutcome,
  MatchWithCircle,
} from "@/server/domain/models/match/match";

const matchRepository = {
  findById: vi.fn(),
  listByCircleSessionId: vi.fn(),
  listByUserId: vi.fn(),
  listByUserIdWithCircleSession: vi.fn(),
  save: vi.fn(),
} satisfies MatchRepository;

const service = createUserStatisticsService({ matchRepository });

const TARGET_USER = userId("target-user");
const OPPONENT = userId("opponent");

const createTestMatch = (
  overrides: Partial<{
    player1Id: ReturnType<typeof userId>;
    player2Id: ReturnType<typeof userId>;
    outcome: MatchOutcome;
  }> = {},
): Match => ({
  id: matchId(`match-${Math.random()}`),
  circleSessionId: circleSessionId("session-1"),
  createdAt: new Date(),
  player1Id: overrides.player1Id ?? TARGET_USER,
  player2Id: overrides.player2Id ?? OPPONENT,
  outcome: overrides.outcome ?? "UNKNOWN",
  deletedAt: null,
});

describe("UserStatisticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMatchStatistics", () => {
    test("対局なしの場合、全て0を返す", async () => {
      matchRepository.listByUserId.mockResolvedValue([]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 0, losses: 0, draws: 0 });
      expect(matchRepository.listByUserId).toHaveBeenCalledWith(TARGET_USER);
    });

    test("player1として勝った場合、winsが1増える", async () => {
      matchRepository.listByUserId.mockResolvedValue([
        createTestMatch({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P1_WIN",
        }),
      ]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 1, losses: 0, draws: 0 });
    });

    test("player1として負けた場合、lossesが1増える", async () => {
      matchRepository.listByUserId.mockResolvedValue([
        createTestMatch({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P2_WIN",
        }),
      ]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 0, losses: 1, draws: 0 });
    });

    test("player2として勝った場合、winsが1増える", async () => {
      matchRepository.listByUserId.mockResolvedValue([
        createTestMatch({
          player1Id: OPPONENT,
          player2Id: TARGET_USER,
          outcome: "P2_WIN",
        }),
      ]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 1, losses: 0, draws: 0 });
    });

    test("player2として負けた場合、lossesが1増える", async () => {
      matchRepository.listByUserId.mockResolvedValue([
        createTestMatch({
          player1Id: OPPONENT,
          player2Id: TARGET_USER,
          outcome: "P1_WIN",
        }),
      ]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 0, losses: 1, draws: 0 });
    });

    test("引き分けの場合、drawsが1増える", async () => {
      matchRepository.listByUserId.mockResolvedValue([
        createTestMatch({ outcome: "DRAW" }),
      ]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 0, losses: 0, draws: 1 });
    });

    test("UNKNOWNの対局は集計から除外される", async () => {
      matchRepository.listByUserId.mockResolvedValue([
        createTestMatch({ outcome: "UNKNOWN" }),
      ]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 0, losses: 0, draws: 0 });
    });

    test("複数対局の混合ケースを正しく集計する", async () => {
      matchRepository.listByUserId.mockResolvedValue([
        // player1として勝ち
        createTestMatch({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P1_WIN",
        }),
        // player2として勝ち
        createTestMatch({
          player1Id: OPPONENT,
          player2Id: TARGET_USER,
          outcome: "P2_WIN",
        }),
        // player1として負け
        createTestMatch({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "P2_WIN",
        }),
        // 引き分け
        createTestMatch({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "DRAW",
        }),
        // UNKNOWN（除外）
        createTestMatch({
          player1Id: TARGET_USER,
          player2Id: OPPONENT,
          outcome: "UNKNOWN",
        }),
      ]);

      const result = await service.getMatchStatistics(TARGET_USER);

      expect(result).toEqual({ wins: 2, losses: 1, draws: 1 });
    });
  });

  describe("getMatchStatisticsByCircle", () => {
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
      ...createTestMatch({
        player1Id: overrides.player1Id,
        player2Id: overrides.player2Id,
        outcome: overrides.outcome,
      }),
      circleId: overrides.circleId ?? CIRCLE_A,
      circleName: overrides.circleName ?? "研究会A",
    });

    test("対局なしの場合、空配列を返す", async () => {
      matchRepository.listByUserIdWithCircleSession.mockResolvedValue([]);

      const result = await service.getMatchStatisticsByCircle(TARGET_USER);

      expect(result).toEqual([]);
      expect(
        matchRepository.listByUserIdWithCircleSession,
      ).toHaveBeenCalledWith(TARGET_USER);
    });

    test("1つの研究会のみの場合、その研究会の統計を返す", async () => {
      matchRepository.listByUserIdWithCircleSession.mockResolvedValue([
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

      const result = await service.getMatchStatisticsByCircle(TARGET_USER);

      expect(result).toEqual([
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
      matchRepository.listByUserIdWithCircleSession.mockResolvedValue([
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

      const result = await service.getMatchStatisticsByCircle(TARGET_USER);

      expect(result).toEqual(
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
      expect(result).toHaveLength(2);
    });
  });
});
