import { beforeEach, describe, expect, test, vi } from "vitest";
import { createUserStatisticsService } from "@/server/application/user/user-statistics-service";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import {
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import type { Match, MatchOutcome } from "@/server/domain/models/match/match";

const matchRepository = {
  findById: vi.fn(),
  listByCircleSessionId: vi.fn(),
  listByUserId: vi.fn(),
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
});
