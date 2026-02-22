import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleSessionParticipationService } from "@/server/application/circle-session/circle-session-participation-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import { ConflictError } from "@/server/domain/common/errors";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";

const circleSessionParticipationRepository = {
  listParticipations: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  areUsersParticipating: vi.fn(),
  removeParticipation: vi.fn(),
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
  circleRepository,
  circleSessionRepository,
  circleSessionParticipationRepository,
  accessService,
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

  test("addParticipation は論理削除済みユーザーをセッションに再参加できる", async () => {
    // listParticipations はアクティブメンバーのみ返す（論理削除済みユーザーは含まれない）
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
    ]);

    const result = await service.addParticipation({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-rejoining"),
      role: "CircleSessionMember",
    });

    expect(result).toBeUndefined();
    expect(
      circleSessionParticipationRepository.addParticipation,
    ).toHaveBeenCalledWith(
      circleSessionId("session-1"),
      userId("user-rejoining"),
      "CircleSessionMember",
    );
  });

  test("addParticipation は既存メンバーの重複追加で ConflictError", async () => {
    vi.mocked(
      circleSessionParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      },
    ]);

    await expect(
      service.addParticipation({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      }),
    ).rejects.toThrow(ConflictError);

    expect(
      circleSessionParticipationRepository.addParticipation,
    ).not.toHaveBeenCalled();
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

    const result = await service.addParticipation({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-2"),
      role: "CircleSessionMember",
    });

    expect(result).toBeUndefined();
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

  test("removeParticipation は対局記録があっても削除できる", async () => {
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
      service.removeParticipation({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
      }),
    ).resolves.toBeUndefined();

    expect(
      circleSessionParticipationRepository.removeParticipation,
    ).toHaveBeenCalledWith(circleSessionId("session-1"), userId("user-1"));
  });

  describe("withdrawParticipation", () => {
    test("メンバーは退会できる", async () => {
      vi.mocked(
        circleSessionParticipationRepository.listParticipations,
      ).mockResolvedValueOnce([
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-actor"),
          role: "CircleSessionMember",
        },
      ]);

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

    test("オーナーは退会できない", async () => {
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

    test("対局記録があっても退会できる", async () => {
      vi.mocked(
        circleSessionParticipationRepository.listParticipations,
      ).mockResolvedValueOnce([
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-actor"),
          role: "CircleSessionMember",
        },
      ]);

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

  describe("countPastSessionsByUserId", () => {
    const NOW = new Date("2025-06-01T00:00:00Z");

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("参加データ0件 → 0を返す", async () => {
      vi.mocked(
        circleSessionParticipationRepository.listByUserId,
      ).mockResolvedValueOnce([]);

      const result = await service.countPastSessionsByUserId(
        userId("user-1"),
      );

      expect(result).toBe(0);
      expect(circleSessionRepository.findByIds).not.toHaveBeenCalled();
    });

    test("全セッションが過去 → 全件カウント", async () => {
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
          ...baseSession(),
          id: circleSessionId("session-1"),
          endsAt: new Date("2025-05-01T12:00:00Z"),
        },
        {
          ...baseSession(),
          id: circleSessionId("session-2"),
          endsAt: new Date("2025-05-15T12:00:00Z"),
        },
      ]);

      const result = await service.countPastSessionsByUserId(
        userId("user-1"),
      );

      expect(result).toBe(2);
    });

    test("全セッションが未来 → 0を返す", async () => {
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
          ...baseSession(),
          id: circleSessionId("session-1"),
          endsAt: new Date("2025-07-01T12:00:00Z"),
        },
        {
          ...baseSession(),
          id: circleSessionId("session-2"),
          endsAt: new Date("2025-08-01T12:00:00Z"),
        },
      ]);

      const result = await service.countPastSessionsByUserId(
        userId("user-1"),
      );

      expect(result).toBe(0);
    });

    test("過去・未来混在 → 過去のみカウント", async () => {
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
        {
          circleSessionId: circleSessionId("session-3"),
          userId: userId("user-1"),
          role: "CircleSessionMember",
        },
      ]);
      vi.mocked(circleSessionRepository.findByIds).mockResolvedValueOnce([
        {
          ...baseSession(),
          id: circleSessionId("session-1"),
          endsAt: new Date("2025-04-01T12:00:00Z"),
        },
        {
          ...baseSession(),
          id: circleSessionId("session-2"),
          endsAt: new Date("2025-05-15T12:00:00Z"),
        },
        {
          ...baseSession(),
          id: circleSessionId("session-3"),
          endsAt: new Date("2025-07-01T12:00:00Z"),
        },
      ]);

      const result = await service.countPastSessionsByUserId(
        userId("user-1"),
      );

      expect(result).toBe(2);
    });

    test("境界値: endsAt === now → 過去としてカウント", async () => {
      vi.mocked(
        circleSessionParticipationRepository.listByUserId,
      ).mockResolvedValueOnce([
        {
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-1"),
          role: "CircleSessionMember",
        },
      ]);
      vi.mocked(circleSessionRepository.findByIds).mockResolvedValueOnce([
        {
          ...baseSession(),
          id: circleSessionId("session-1"),
          endsAt: new Date("2025-06-01T00:00:00Z"),
        },
      ]);

      const result = await service.countPastSessionsByUserId(
        userId("user-1"),
      );

      expect(result).toBe(1);
    });
  });
});
