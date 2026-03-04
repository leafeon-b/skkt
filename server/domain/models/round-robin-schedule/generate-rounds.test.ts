import { describe, expect, test } from "vitest";
import { userId } from "@/server/domain/common/ids";
import { generateRounds } from "@/server/domain/models/round-robin-schedule/generate-rounds";
import type { UserId } from "@/server/domain/common/ids";

const ids = (...names: string[]): UserId[] => names.map((n) => userId(n));

describe("generateRounds", () => {
  describe("バリデーション", () => {
    test("0人の場合エラーになる", () => {
      expect(() => generateRounds([])).toThrow(
        "Round-robin requires at least 2 participants",
      );
    });

    test("1人の場合エラーになる", () => {
      expect(() => generateRounds(ids("u1"))).toThrow(
        "Round-robin requires at least 2 participants",
      );
    });

    test("重複IDの場合エラーになる", () => {
      expect(() => generateRounds(ids("u1", "u1"))).toThrow(
        "Duplicate participant IDs are not allowed",
      );
    });
  });

  describe("偶数人数", () => {
    test("2人の場合: 1ラウンド1対戦", () => {
      const rounds = generateRounds(ids("u1", "u2"));

      expect(rounds).toHaveLength(1);
      expect(rounds[0].pairings).toHaveLength(1);
    });

    test("4人の場合: 3ラウンド各2対戦", () => {
      const rounds = generateRounds(ids("u1", "u2", "u3", "u4"));

      expect(rounds).toHaveLength(3);
      for (const round of rounds) {
        expect(round.pairings).toHaveLength(2);
      }
    });

    test("6人の場合: 5ラウンド各3対戦", () => {
      const rounds = generateRounds(
        ids("u1", "u2", "u3", "u4", "u5", "u6"),
      );

      expect(rounds).toHaveLength(5);
      for (const round of rounds) {
        expect(round.pairings).toHaveLength(3);
      }
    });
  });

  describe("奇数人数", () => {
    test("3人の場合: 3ラウンド各1対戦", () => {
      const rounds = generateRounds(ids("u1", "u2", "u3"));

      expect(rounds).toHaveLength(3);
      for (const round of rounds) {
        expect(round.pairings).toHaveLength(1);
      }
    });

    test("5人の場合: 5ラウンド各2対戦", () => {
      const rounds = generateRounds(ids("u1", "u2", "u3", "u4", "u5"));

      expect(rounds).toHaveLength(5);
      for (const round of rounds) {
        expect(round.pairings).toHaveLength(2);
      }
    });
  });

  describe("不変条件", () => {
    test("全ペアがちょうど1回出現する", () => {
      const participants = ids("u1", "u2", "u3", "u4");
      const rounds = generateRounds(participants);

      const pairSet = new Set<string>();
      for (const round of rounds) {
        for (const p of round.pairings) {
          const key = [p.player1Id, p.player2Id].sort().join("-");
          expect(pairSet.has(key)).toBe(false);
          pairSet.add(key);
        }
      }

      const expectedPairs = (participants.length * (participants.length - 1)) / 2;
      expect(pairSet.size).toBe(expectedPairs);
    });

    test("ラウンド内で同一プレイヤーが重複しない", () => {
      const rounds = generateRounds(ids("u1", "u2", "u3", "u4", "u5"));

      for (const round of rounds) {
        const playersInRound: string[] = [];
        for (const p of round.pairings) {
          playersInRound.push(p.player1Id, p.player2Id);
        }
        expect(new Set(playersInRound).size).toBe(playersInRound.length);
      }
    });

    test("合計対戦数が n*(n-1)/2 と一致する", () => {
      const participants = ids("u1", "u2", "u3", "u4", "u5", "u6");
      const rounds = generateRounds(participants);

      const totalPairings = rounds.reduce(
        (sum, r) => sum + r.pairings.length,
        0,
      );
      const expected = (participants.length * (participants.length - 1)) / 2;
      expect(totalPairings).toBe(expected);
    });

    test("ラウンド番号が1始まり連番である", () => {
      const rounds = generateRounds(ids("u1", "u2", "u3", "u4"));

      const numbers = rounds.map((r) => r.roundNumber);
      expect(numbers).toEqual([1, 2, 3]);
    });
  });
});
