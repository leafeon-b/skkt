import { beforeEach, describe, expect, test, vi } from "vitest";
import { createMatchService } from "@/server/application/match/match-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createInMemoryMatchRepository,
  createInMemoryCircleSessionRepository,
  createInMemoryRepositories,
} from "@/server/infrastructure/repository/in-memory";
import {
  circleId,
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import { createMatch } from "@/server/domain/models/match/match";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";

const matchRepository = createInMemoryMatchRepository();

const circleSessionRepository = createInMemoryCircleSessionRepository();

const accessService = createAccessServiceStub();

const service = createMatchService({
  matchRepository,
  circleSessionRepository,
  accessService,
});

const baseMatchParams = {
  id: matchId("match-1"),
  circleSessionId: circleSessionId("session-1"),
  player1Id: userId("user-1"),
  player2Id: userId("user-2"),
  outcome: "P1_WIN" as const,
};

const baseSession = () =>
  createCircleSession({
    id: circleSessionId("session-1"),
    circleId: circleId("circle-1"),
    title: "第1回 研究会",
    startsAt: new Date("2024-01-01T00:00:00Z"),
    endsAt: new Date("2024-01-02T00:00:00Z"),
    location: null,
    note: "",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  });

const addSessionMemberships = async () => {
  await circleSessionRepository.addMembership(
    circleSessionId("session-1"),
    userId("user-1"),
    "CircleSessionMember",
  );
  await circleSessionRepository.addMembership(
    circleSessionId("session-1"),
    userId("user-2"),
    "CircleSessionMember",
  );
};

beforeEach(async () => {
  matchRepository._store.clear();
  circleSessionRepository._sessionStore.clear();
  circleSessionRepository._membershipStore.clear();
  vi.clearAllMocks();
  await circleSessionRepository.save(baseSession());
  await addSessionMemberships();
  vi.mocked(accessService.canRecordMatch).mockResolvedValue(true);
  vi.mocked(accessService.canViewMatch).mockResolvedValue(true);
  vi.mocked(accessService.canEditMatch).mockResolvedValue(true);
  vi.mocked(accessService.canDeleteMatch).mockResolvedValue(true);
});

describe("Match サービス", () => {
  describe("認可拒否時のエラー", () => {
    test("recordMatch は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canRecordMatch).mockResolvedValue(false);

      await expect(
        service.recordMatch({
          actorId: userId("user-3"),
          ...baseMatchParams,
        }),
      ).rejects.toThrow("Forbidden");

      const saved = await matchRepository.findById(baseMatchParams.id);
      expect(saved).toBeNull();
    });

    test("updateMatch は認可拒否時に Forbidden エラー", async () => {
      const existing = createMatch(baseMatchParams);
      await matchRepository.save(existing);
      vi.mocked(accessService.canEditMatch).mockResolvedValue(false);

      await expect(
        service.updateMatch({
          actorId: userId("user-3"),
          id: baseMatchParams.id,
          outcome: "DRAW",
        }),
      ).rejects.toThrow("Forbidden");

      const saved = await matchRepository.findById(baseMatchParams.id);
      expect(saved!.outcome).toBe("P1_WIN");
    });
  });

  test("recordMatch は参加者でない場合にエラー", async () => {
    circleSessionRepository._membershipStore.clear();

    await expect(
      service.recordMatch({
        actorId: userId("user-3"),
        ...baseMatchParams,
      }),
    ).rejects.toThrow("Players must belong to the circle session");

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved).toBeNull();
  });

  test("recordMatch は対局を保存する", async () => {
    const result = await service.recordMatch({
      actorId: userId("user-3"),
      ...baseMatchParams,
    });

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved).not.toBeNull();
    expect(saved!.id).toBe(baseMatchParams.id);
    expect(saved!.circleSessionId).toBe(baseMatchParams.circleSessionId);
    expect(saved!.player1Id).toBe(baseMatchParams.player1Id);
    expect(saved!.player2Id).toBe(baseMatchParams.player2Id);
    expect(saved!.outcome).toBe("P1_WIN");
    expect(result.outcome).toBe("P1_WIN");
  });

  test("updateMatch は片方だけの指定でエラー", async () => {
    const existing = createMatch(baseMatchParams);
    await matchRepository.save(existing);

    await expect(
      service.updateMatch({
        actorId: userId("user-3"),
        id: baseMatchParams.id,
        player1Id: userId("user-4"),
      }),
    ).rejects.toThrow("player1Id and player2Id must both be provided");

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved!.player1Id).toBe(baseMatchParams.player1Id);
  });

  test("updateMatch は参加者でない場合にエラー", async () => {
    const existing = createMatch(baseMatchParams);
    await matchRepository.save(existing);

    await expect(
      service.updateMatch({
        actorId: userId("user-3"),
        id: baseMatchParams.id,
        player1Id: userId("user-4"),
        player2Id: userId("user-5"),
      }),
    ).rejects.toThrow("Players must belong to the circle session");

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved!.player1Id).toBe(baseMatchParams.player1Id);
    expect(saved!.player2Id).toBe(baseMatchParams.player2Id);
  });

  test("updateMatch は結果を更新する", async () => {
    const existing = createMatch(baseMatchParams);
    await matchRepository.save(existing);

    const updated = await service.updateMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
      outcome: "DRAW",
    });

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved!.outcome).toBe("DRAW");
    expect(updated.outcome).toBe("DRAW");
  });

  test("deleteMatch は削除済みならエラー", async () => {
    const existing = {
      ...createMatch(baseMatchParams),
      deletedAt: new Date("2024-01-01T00:00:00Z"),
    };
    await matchRepository.save(existing);

    await expect(
      service.deleteMatch({
        actorId: userId("user-3"),
        id: baseMatchParams.id,
      }),
    ).rejects.toThrow("Match is deleted");

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved!.deletedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
  });

  test("deleteMatch は対局を論理削除する", async () => {
    const existing = createMatch(baseMatchParams);
    await matchRepository.save(existing);

    const deleted = await service.deleteMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
    });

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved!.deletedAt).not.toBeNull();
    expect(deleted.deletedAt).not.toBeNull();
  });

  test("updateMatch はプレイヤーを変更する", async () => {
    const existing = createMatch(baseMatchParams);
    await matchRepository.save(existing);
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-4"),
      "CircleSessionMember",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-5"),
      "CircleSessionMember",
    );

    const updated = await service.updateMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
      player1Id: userId("user-4"),
      player2Id: userId("user-5"),
    });

    const saved = await matchRepository.findById(baseMatchParams.id);
    expect(saved!.player1Id).toBe(userId("user-4"));
    expect(saved!.player2Id).toBe(userId("user-5"));
    expect(updated.player1Id).toBe(userId("user-4"));
    expect(updated.player2Id).toBe(userId("user-5"));
  });
});

describe("UnitOfWork 経路", () => {
  const { repos, unitOfWork, stores } = createInMemoryRepositories();

  const uowAccessService = createAccessServiceStub();

  const uowService = createMatchService({
    matchRepository: repos.matchRepository,
    circleSessionRepository: repos.circleSessionRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  const uowBaseSession = () =>
    createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T00:00:00Z"),
      endsAt: new Date("2024-01-02T00:00:00Z"),
      location: null,
      note: "",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

  const addUowSessionMemberships = async () => {
    await repos.circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionMember",
    );
    await repos.circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-2"),
      "CircleSessionMember",
    );
  };

  beforeEach(async () => {
    stores.matchStore.clear();
    stores.circleSessionStore.clear();
    stores.circleSessionMembershipStore.clear();
    vi.clearAllMocks();
    vi.mocked(uowAccessService.canRecordMatch).mockResolvedValue(true);
    vi.mocked(uowAccessService.canEditMatch).mockResolvedValue(true);
    vi.mocked(uowAccessService.canDeleteMatch).mockResolvedValue(true);
    await repos.circleSessionRepository.save(uowBaseSession());
    await addUowSessionMemberships();
  });

  test("recordMatch は UoW 経由で対局を保存する", async () => {
    await uowService.recordMatch({
      actorId: userId("user-3"),
      ...baseMatchParams,
    });

    const saved = await repos.matchRepository.findById(baseMatchParams.id);
    expect(saved).not.toBeNull();
    expect(saved!.id).toBe(baseMatchParams.id);
  });

  test("updateMatch は UoW 経由で結果を更新する", async () => {
    const existing = createMatch(baseMatchParams);
    await repos.matchRepository.save(existing);

    await uowService.updateMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
      outcome: "DRAW",
    });

    const saved = await repos.matchRepository.findById(baseMatchParams.id);
    expect(saved!.outcome).toBe("DRAW");
  });

  test("deleteMatch は UoW 経由で対局を論理削除する", async () => {
    const existing = createMatch(baseMatchParams);
    await repos.matchRepository.save(existing);

    await uowService.deleteMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
    });

    const saved = await repos.matchRepository.findById(baseMatchParams.id);
    expect(saved!.deletedAt).not.toBeNull();
  });

  test("UoW 内でエラーが発生した場合に伝播する", async () => {
    vi.spyOn(repos.matchRepository, "save").mockRejectedValueOnce(
      new Error("DB error"),
    );

    await expect(
      uowService.recordMatch({
        actorId: userId("user-3"),
        ...baseMatchParams,
      }),
    ).rejects.toThrow("DB error");
  });
});
