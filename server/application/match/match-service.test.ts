import { beforeEach, describe, expect, test, vi } from "vitest";
import { createMatchService } from "@/server/application/match/match-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createMockMatchRepository,
  createMockCircleSessionRepository,
  createMockUnitOfWork,
} from "@/server/application/test-helpers/mock-repositories";
import {
  circleId,
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import { createMatch } from "@/server/domain/models/match/match";

const matchRepository = createMockMatchRepository();

const circleSessionRepository = createMockCircleSessionRepository();

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

const baseSession = () => ({
  id: circleSessionId("session-1"),
  circleId: circleId("circle-1"),
  title: "第1回 研究会",
  startsAt: new Date("2024-01-01T00:00:00Z"),
  endsAt: new Date("2024-01-02T00:00:00Z"),
  location: null,
  note: "",
  createdAt: new Date("2024-01-01T00:00:00Z"),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(circleSessionRepository.findById).mockResolvedValue(baseSession());
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

      expect(matchRepository.save).not.toHaveBeenCalled();
    });

    test("updateMatch は認可拒否時に Forbidden エラー", async () => {
      const existing = createMatch(baseMatchParams);
      vi.mocked(matchRepository.findById).mockResolvedValue(existing);
      vi.mocked(accessService.canEditMatch).mockResolvedValue(false);

      await expect(
        service.updateMatch({
          actorId: userId("user-3"),
          id: baseMatchParams.id,
          outcome: "DRAW",
        }),
      ).rejects.toThrow("Forbidden");

      expect(matchRepository.save).not.toHaveBeenCalled();
    });
  });

  test("recordMatch は参加者でない場合にエラー", async () => {
    vi.mocked(
      circleSessionRepository.areUsersParticipating,
    ).mockResolvedValue(false);

    await expect(
      service.recordMatch({
        actorId: userId("user-3"),
        ...baseMatchParams,
      }),
    ).rejects.toThrow("Players must belong to the circle session");

    expect(matchRepository.save).not.toHaveBeenCalled();
  });

  test("recordMatch は対局を保存する", async () => {
    vi.mocked(
      circleSessionRepository.areUsersParticipating,
    ).mockResolvedValue(true);

    const result = await service.recordMatch({
      actorId: userId("user-3"),
      ...baseMatchParams,
    });

    expect(matchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseMatchParams.id,
        circleSessionId: baseMatchParams.circleSessionId,
        player1Id: baseMatchParams.player1Id,
        player2Id: baseMatchParams.player2Id,
        outcome: "P1_WIN",
      }),
    );
    expect(result.outcome).toBe("P1_WIN");
  });

  test("updateMatch は片方だけの指定でエラー", async () => {
    const existing = createMatch(baseMatchParams);
    vi.mocked(matchRepository.findById).mockResolvedValue(existing);

    await expect(
      service.updateMatch({
        actorId: userId("user-3"),
        id: baseMatchParams.id,
        player1Id: userId("user-4"),
      }),
    ).rejects.toThrow("player1Id and player2Id must both be provided");

    expect(matchRepository.save).not.toHaveBeenCalled();
  });

  test("updateMatch は参加者でない場合にエラー", async () => {
    const existing = createMatch(baseMatchParams);
    vi.mocked(matchRepository.findById).mockResolvedValue(existing);
    vi.mocked(
      circleSessionRepository.areUsersParticipating,
    ).mockResolvedValue(false);

    await expect(
      service.updateMatch({
        actorId: userId("user-3"),
        id: baseMatchParams.id,
        player1Id: userId("user-4"),
        player2Id: userId("user-5"),
      }),
    ).rejects.toThrow("Players must belong to the circle session");

    expect(matchRepository.save).not.toHaveBeenCalled();
  });

  test("updateMatch は結果を更新する", async () => {
    const existing = createMatch(baseMatchParams);
    vi.mocked(matchRepository.findById).mockResolvedValue(existing);

    const updated = await service.updateMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
      outcome: "DRAW",
    });

    expect(matchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "DRAW" }),
    );
    expect(updated.outcome).toBe("DRAW");
  });

  test("deleteMatch は削除済みならエラー", async () => {
    const existing = {
      ...createMatch(baseMatchParams),
      deletedAt: new Date("2024-01-01T00:00:00Z"),
    };
    vi.mocked(matchRepository.findById).mockResolvedValue(existing);

    await expect(
      service.deleteMatch({
        actorId: userId("user-3"),
        id: baseMatchParams.id,
      }),
    ).rejects.toThrow("Match is deleted");

    expect(matchRepository.save).not.toHaveBeenCalled();
  });

  test("deleteMatch は対局を論理削除する", async () => {
    const existing = createMatch(baseMatchParams);
    vi.mocked(matchRepository.findById).mockResolvedValue(existing);

    const deleted = await service.deleteMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
    });

    expect(matchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseMatchParams.id,
        deletedAt: expect.any(Date),
      }),
    );
    expect(deleted.deletedAt).not.toBeNull();
  });

  test("updateMatch はプレイヤーを変更する", async () => {
    const existing = createMatch(baseMatchParams);
    vi.mocked(matchRepository.findById).mockResolvedValue(existing);
    vi.mocked(
      circleSessionRepository.areUsersParticipating,
    ).mockResolvedValue(true);

    const updated = await service.updateMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
      player1Id: userId("user-4"),
      player2Id: userId("user-5"),
    });

    expect(
      circleSessionRepository.areUsersParticipating,
    ).toHaveBeenCalledWith(baseMatchParams.circleSessionId, [
      userId("user-4"),
      userId("user-5"),
    ]);
    expect(matchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        player1Id: userId("user-4"),
        player2Id: userId("user-5"),
      }),
    );
    expect(updated.player1Id).toBe(userId("user-4"));
    expect(updated.player2Id).toBe(userId("user-5"));
  });
});

describe("UnitOfWork 経路", () => {
  const depsMatchRepository = createMockMatchRepository();
  const depsCircleSessionRepository = createMockCircleSessionRepository();
  const { unitOfWork, repos } = createMockUnitOfWork();

  const uowAccessService = createAccessServiceStub();

  const uowService = createMatchService({
    matchRepository: depsMatchRepository,
    circleSessionRepository: depsCircleSessionRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uowAccessService.canRecordMatch).mockResolvedValue(true);
    vi.mocked(uowAccessService.canEditMatch).mockResolvedValue(true);
    vi.mocked(uowAccessService.canDeleteMatch).mockResolvedValue(true);
    vi.mocked(repos.circleSessionRepository.findById).mockResolvedValue(
      baseSession(),
    );
    vi.mocked(
      repos.circleSessionRepository.areUsersParticipating,
    ).mockResolvedValue(true);
  });

  test("recordMatch は unitOfWork を呼び出す", async () => {
    await uowService.recordMatch({
      actorId: userId("user-3"),
      ...baseMatchParams,
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(repos.matchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: baseMatchParams.id }),
    );
    // deps側のリポジトリは呼ばれない
    expect(depsMatchRepository.save).not.toHaveBeenCalled();
  });

  test("updateMatch は unitOfWork を呼び出す", async () => {
    const existing = createMatch(baseMatchParams);
    vi.mocked(repos.matchRepository.findById).mockResolvedValue(existing);

    await uowService.updateMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
      outcome: "DRAW",
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(repos.matchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "DRAW" }),
    );
    expect(depsMatchRepository.save).not.toHaveBeenCalled();
  });

  test("deleteMatch は unitOfWork を呼び出す", async () => {
    const existing = createMatch(baseMatchParams);
    vi.mocked(repos.matchRepository.findById).mockResolvedValue(existing);

    await uowService.deleteMatch({
      actorId: userId("user-3"),
      id: baseMatchParams.id,
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(repos.matchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
    expect(depsMatchRepository.save).not.toHaveBeenCalled();
  });

  test("UoW 内でエラーが発生した場合に伝播する", async () => {
    vi.mocked(repos.matchRepository.save).mockRejectedValue(
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
