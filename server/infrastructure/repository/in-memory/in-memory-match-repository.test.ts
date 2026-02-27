import { describe, expect, test } from "vitest";
import { createInMemoryMatchRepository } from "./in-memory-match-repository";
import { createInMemoryCircleRepository } from "./in-memory-circle-repository";
import { createInMemoryCircleSessionRepository } from "./in-memory-circle-session-repository";
import {
  createMatch,
  deleteMatch,
} from "@/server/domain/models/match/match";
import { createCircle } from "@/server/domain/models/circle/circle";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import {
  circleId,
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";

describe("InMemoryMatchRepository", () => {
  const makeRepos = () => {
    const circleRepo = createInMemoryCircleRepository();
    const sessionRepo = createInMemoryCircleSessionRepository();
    const matchRepo = createInMemoryMatchRepository(new Map(), {
      circleSessionStore: sessionRepo._sessionStore,
      circleStore: circleRepo._circleStore,
    });
    return { circleRepo, sessionRepo, matchRepo };
  };

  const makeStandaloneRepo = () => createInMemoryMatchRepository();

  describe("基本 CRUD", () => {
    test("save した Match を findById で取得できる", async () => {
      const repo = makeStandaloneRepo();
      const match = createMatch({
        id: matchId("m1"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u1"),
        player2Id: userId("u2"),
      });
      await repo.save(match);

      const found = await repo.findById(matchId("m1"));
      expect(found).toEqual(match);
    });

    test("存在しない Match は null を返す", async () => {
      const repo = makeStandaloneRepo();
      const found = await repo.findById(matchId("not-exist"));
      expect(found).toBeNull();
    });
  });

  describe("listByCircleSessionId", () => {
    test("セッション内の Match を createdAt asc で返す", async () => {
      const repo = makeStandaloneRepo();
      const m1 = createMatch({
        id: matchId("m1"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u1"),
        player2Id: userId("u2"),
      });
      const m2 = createMatch({
        id: matchId("m2"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u3"),
        player2Id: userId("u4"),
      });
      // m1 の createdAt を古くする
      await repo.save({ ...m1, createdAt: new Date("2024-01-01") });
      await repo.save({ ...m2, createdAt: new Date("2024-06-01") });

      const result = await repo.listByCircleSessionId(circleSessionId("s1"));
      expect(result.map((m) => m.id)).toEqual([matchId("m1"), matchId("m2")]);
    });
  });

  describe("listByPlayerId", () => {
    test("プレイヤーの非削除 Match を返す", async () => {
      const repo = makeStandaloneRepo();
      const m1 = createMatch({
        id: matchId("m1"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u1"),
        player2Id: userId("u2"),
      });
      const m2 = createMatch({
        id: matchId("m2"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u3"),
        player2Id: userId("u1"),
      });
      const deleted = deleteMatch(
        createMatch({
          id: matchId("m3"),
          circleSessionId: circleSessionId("s1"),
          player1Id: userId("u1"),
          player2Id: userId("u4"),
        }),
      );
      await repo.save(m1);
      await repo.save(m2);
      await repo.save(deleted);

      const result = await repo.listByPlayerId(userId("u1"));
      expect(result).toHaveLength(2);
    });
  });

  describe("listByBothPlayerIds", () => {
    test("両プレイヤー間の非削除 Match を双方向で返す", async () => {
      const repo = makeStandaloneRepo();
      const m1 = createMatch({
        id: matchId("m1"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u1"),
        player2Id: userId("u2"),
      });
      const m2 = createMatch({
        id: matchId("m2"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u2"),
        player2Id: userId("u1"),
      });
      const unrelated = createMatch({
        id: matchId("m3"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u1"),
        player2Id: userId("u3"),
      });
      await repo.save(m1);
      await repo.save(m2);
      await repo.save(unrelated);

      const result = await repo.listByBothPlayerIds(
        userId("u1"),
        userId("u2"),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("listByPlayerIdWithCircle", () => {
    test("Match に Circle 情報を付与して返す", async () => {
      const { circleRepo, sessionRepo, matchRepo } = makeRepos();

      const circle = createCircle({ id: circleId("c1"), name: "テスト研究会" });
      await circleRepo.save(circle);

      const session = createCircleSession({
        id: circleSessionId("s1"),
        circleId: circleId("c1"),
        title: "Session 1",
        startsAt: new Date("2024-06-01T10:00:00Z"),
        endsAt: new Date("2024-06-01T12:00:00Z"),
      });
      await sessionRepo.save(session);

      const match = createMatch({
        id: matchId("m1"),
        circleSessionId: circleSessionId("s1"),
        player1Id: userId("u1"),
        player2Id: userId("u2"),
      });
      await matchRepo.save(match);

      const result = await matchRepo.listByPlayerIdWithCircle(userId("u1"));
      expect(result).toHaveLength(1);
      expect(result[0].circleId).toBe(circleId("c1"));
      expect(result[0].circleName).toBe("テスト研究会");
    });

    test("論理削除された Match は除外される", async () => {
      const { circleRepo, sessionRepo, matchRepo } = makeRepos();

      const circle = createCircle({ id: circleId("c1"), name: "テスト" });
      await circleRepo.save(circle);
      const session = createCircleSession({
        id: circleSessionId("s1"),
        circleId: circleId("c1"),
        title: "Session",
        startsAt: new Date("2024-06-01T10:00:00Z"),
        endsAt: new Date("2024-06-01T12:00:00Z"),
      });
      await sessionRepo.save(session);

      const deleted = deleteMatch(
        createMatch({
          id: matchId("m1"),
          circleSessionId: circleSessionId("s1"),
          player1Id: userId("u1"),
          player2Id: userId("u2"),
        }),
      );
      await matchRepo.save(deleted);

      const result = await matchRepo.listByPlayerIdWithCircle(userId("u1"));
      expect(result).toHaveLength(0);
    });
  });

  describe("listDistinctOpponentIds", () => {
    test("重複を排除して対戦相手 ID を返す", async () => {
      const repo = makeStandaloneRepo();
      // u1 vs u2 (2回)
      await repo.save({
        ...createMatch({
          id: matchId("m1"),
          circleSessionId: circleSessionId("s1"),
          player1Id: userId("u1"),
          player2Id: userId("u2"),
        }),
        createdAt: new Date("2024-01-01"),
      });
      await repo.save({
        ...createMatch({
          id: matchId("m2"),
          circleSessionId: circleSessionId("s1"),
          player1Id: userId("u2"),
          player2Id: userId("u1"),
        }),
        createdAt: new Date("2024-01-02"),
      });
      // u1 vs u3
      await repo.save({
        ...createMatch({
          id: matchId("m3"),
          circleSessionId: circleSessionId("s1"),
          player1Id: userId("u1"),
          player2Id: userId("u3"),
        }),
        createdAt: new Date("2024-01-03"),
      });

      const result = await repo.listDistinctOpponentIds(userId("u1"));
      expect(result).toHaveLength(2);
      expect(new Set(result)).toEqual(
        new Set([userId("u2"), userId("u3")]),
      );
    });

    test("論理削除された Match は除外される", async () => {
      const repo = makeStandaloneRepo();
      const deleted = deleteMatch(
        createMatch({
          id: matchId("m1"),
          circleSessionId: circleSessionId("s1"),
          player1Id: userId("u1"),
          player2Id: userId("u2"),
        }),
      );
      await repo.save(deleted);

      const result = await repo.listDistinctOpponentIds(userId("u1"));
      expect(result).toHaveLength(0);
    });
  });
});
