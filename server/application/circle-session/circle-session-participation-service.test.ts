import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleSessionParticipationService } from "@/server/application/circle-session/circle-session-participation-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { MatchRepository } from "@/server/domain/models/match/match-repository";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import {
  circleId,
  circleSessionId,
  matchId,
  userId,
} from "@/server/domain/common/ids";
import { createMatch } from "@/server/domain/models/match/match";

const matchRepository = {
  findById: vi.fn(),
  listByCircleSessionId: vi.fn(),
  save: vi.fn(),
} satisfies MatchRepository;

const circleSessionParticipationRepository = {
  listParticipations: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  areUsersParticipating: vi.fn(),
  removeParticipation: vi.fn(),
  removeAllByCircleAndUser: vi.fn(),
} satisfies CircleSessionParticipationRepository;

const circleSessionRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  listByCircleId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleSessionRepository;

const circleRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleRepository;

const accessService = createAccessServiceStub();

const service = createCircleSessionParticipationService({
  matchRepository,
  circleRepository,
  circleSessionRepository,
  circleSessionParticipationRepository,
  accessService,
});

const baseMatch = () =>
  createMatch({
    id: matchId("match-1"),
    circleSessionId: circleSessionId("session-1"),

    player1Id: userId("user-1"),
    player2Id: userId("user-2"),
    outcome: "P1_WIN",
  });

const baseSession = () => ({
  id: circleSessionId("session-1"),
  circleId: circleId("circle-1"),
  title: "第1回 研究会",
  startsAt: new Date(),
  endsAt: new Date(),
  location: null,
  note: "",
  createdAt: new Date(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(circleSessionRepository.findById).mockResolvedValue(baseSession());
  vi.mocked(accessService.canListOwnCircles).mockResolvedValue(true);
  vi.mocked(accessService.canViewCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canAddCircleSessionMember).mockResolvedValue(true);
  vi.mocked(accessService.canChangeCircleSessionMemberRole).mockResolvedValue(
    true,
  );
  vi.mocked(accessService.canTransferCircleSessionOwnership).mockResolvedValue(
    true,
  );
  vi.mocked(accessService.canRemoveCircleSessionMember).mockResolvedValue(true);
  vi.mocked(accessService.canWithdrawFromCircleSession).mockResolvedValue(true);
});

describe("CircleSession 参加関係サービス", () => {
  describe("認可拒否時のエラー", () => {
    test("listParticipations は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canViewCircleSession).mockResolvedValue(false);

      await expect(
        service.listParticipations({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleSessionParticipationRepository.listParticipations,
      ).not.toHaveBeenCalled();
    });

    test("addParticipation は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canAddCircleSessionMember).mockResolvedValue(
        false,
      );

      await expect(
        service.addParticipation({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-1"),
          role: "CircleSessionMember",
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleSessionParticipationRepository.addParticipation,
      ).not.toHaveBeenCalled();
    });
  });

  test("listParticipations は一覧を返す", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
    ]);

    const result = await service.listParticipations({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
    });

    expect(
      circleSessionParticipationRepository.listParticipations,
    ).toHaveBeenCalledWith(circleSessionId("session-1"));
    expect(result).toEqual([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
    ]);
  });

  test("addParticipation は Owner がいない状態で Member を拒否する", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([]);

    await expect(
      service.addParticipation({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      }),
    ).rejects.toThrow("CircleSession must have exactly one owner");

    expect(
      circleSessionParticipationRepository.addParticipation,
    ).not.toHaveBeenCalled();
  });

  test("listByUserId は参加回の要約を返す", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listByUserId,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      },
      {
        circleSessionId: circleSessionId("session-2"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      },
    ]);
    vi.mocked(circleSessionRepository.findByIds).mockResolvedValueOnce([
      {
        id: circleSessionId("session-1"),
        circleId: circleId("circle-1"),
        title: "第1回 研究会",
        startsAt: new Date("2024-02-01T10:00:00Z"),
        endsAt: new Date("2024-02-01T12:00:00Z"),
        location: "京都キャンパス A",
        note: "",
        createdAt: new Date("2024-02-01T00:00:00Z"),
      },
      {
        id: circleSessionId("session-2"),
        circleId: circleId("circle-1"),
        title: "第2回 研究会",
        startsAt: new Date("2024-03-01T10:00:00Z"),
        endsAt: new Date("2024-03-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2024-03-01T00:00:00Z"),
      },
    ]);
    vi.mocked(circleRepository.findByIds).mockResolvedValueOnce([
      {
        id: circleId("circle-1"),
        name: "京大将棋研究会",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    ]);

    const result = await service.listByUserId({
      actorId: "user-1",
      userId: userId("user-1"),
    });

    expect(
      circleSessionParticipationRepository.listByUserId,
    ).toHaveBeenCalledWith(userId("user-1"));
    expect(circleSessionRepository.findByIds).toHaveBeenCalledWith([
      circleSessionId("session-1"),
      circleSessionId("session-2"),
    ]);
    expect(circleRepository.findByIds).toHaveBeenCalledWith([
      circleId("circle-1"),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]?.circleName).toBe("京大将棋研究会");
    expect(result[0]?.title).toBe("第2回 研究会");
  });

  test("addParticipation は Owner がいる場合に Member を追加できる", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
    ]);

    await service.addParticipation({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-2"),
      role: "CircleSessionMember",
    });

    expect(
      circleSessionParticipationRepository.addParticipation,
    ).toHaveBeenCalledWith(
      circleSessionId("session-1"),
      userId("user-2"),
      "CircleSessionMember",
    );
  });

  test("changeParticipationRole は Owner への変更を拒否する", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      },
    ]);

    await expect(
      service.changeParticipationRole({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      }),
    ).rejects.toThrow("Use transferOwnership to assign owner");
  });

  test("transferOwnership は Owner を移譲する", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-2"),
        role: "CircleSessionMember",
      },
    ]);

    await service.transferOwnership({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      fromUserId: userId("user-1"),
      toUserId: userId("user-2"),
    });

    expect(
      circleSessionParticipationRepository.updateParticipationRole,
    ).toHaveBeenCalledWith(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionManager",
    );
    expect(
      circleSessionParticipationRepository.updateParticipationRole,
    ).toHaveBeenCalledWith(
      circleSessionId("session-1"),
      userId("user-2"),
      "CircleSessionOwner",
    );
  });

  test("removeParticipation は対局に登場する参加者を削除できない", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      },
    ]);
    vi.mocked(matchRepository.listByCircleSessionId).mockResolvedValue([
      baseMatch(),
    ]);

    await expect(
      service.removeParticipation({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
      }),
    ).rejects.toThrow("Participation cannot be removed because matches exist");

    expect(
      circleSessionParticipationRepository.removeParticipation,
    ).not.toHaveBeenCalled();
  });

  test("removeParticipation は対局に登場しない参加者を削除できる", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-3"),
        role: "CircleSessionMember",
      },
    ]);
    vi.mocked(matchRepository.listByCircleSessionId).mockResolvedValue([
      baseMatch(),
    ]);

    await expect(
      service.removeParticipation({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-3"),
      }),
    ).resolves.toBeUndefined();

    expect(
      circleSessionParticipationRepository.removeParticipation,
    ).toHaveBeenCalledWith(circleSessionId("session-1"), userId("user-3"));
  });

  describe("withdrawParticipation", () => {
    test("メンバーは脱退できる", async () => {
      vi.mocked(
        circleSessionParticipationRepository.listParticipations,
      ).mockResolvedValueOnce([
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-actor"),
          role: "CircleSessionMember",
        },
      ]);
      vi.mocked(matchRepository.listByCircleSessionId).mockResolvedValue([]);

      await expect(
        service.withdrawParticipation({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).resolves.toBeUndefined();

      expect(
        circleSessionParticipationRepository.removeParticipation,
      ).toHaveBeenCalledWith(
        circleSessionId("session-1"),
        userId("user-actor"),
      );
    });

    test("オーナーは脱退できない", async () => {
      vi.mocked(
        circleSessionParticipationRepository.listParticipations,
      ).mockResolvedValueOnce([
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-actor"),
          role: "CircleSessionOwner",
        },
      ]);

      await expect(
        service.withdrawParticipation({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).rejects.toThrow(
        "Owner cannot withdraw from session. Use transferOwnership instead",
      );

      expect(
        circleSessionParticipationRepository.removeParticipation,
      ).not.toHaveBeenCalled();
    });

    test("対局記録がある場合は脱退できない", async () => {
      vi.mocked(
        circleSessionParticipationRepository.listParticipations,
      ).mockResolvedValueOnce([
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-actor"),
          role: "CircleSessionMember",
        },
      ]);
      vi.mocked(matchRepository.listByCircleSessionId).mockResolvedValue([
        createMatch({
          id: matchId("match-1"),
          circleSessionId: circleSessionId("session-1"),
      
          player1Id: userId("user-actor"),
          player2Id: userId("user-2"),
          outcome: "P1_WIN",
        }),
      ]);

      await expect(
        service.withdrawParticipation({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).rejects.toThrow(
        "Participation cannot be removed because matches exist",
      );

      expect(
        circleSessionParticipationRepository.removeParticipation,
      ).not.toHaveBeenCalled();
    });

    test("非メンバーは Forbidden エラー", async () => {
      vi.mocked(accessService.canWithdrawFromCircleSession).mockResolvedValue(
        false,
      );

      await expect(
        service.withdrawParticipation({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleSessionParticipationRepository.removeParticipation,
      ).not.toHaveBeenCalled();
    });
  });
});
