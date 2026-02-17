import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleParticipationService } from "@/server/application/circle/circle-participation-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import { ForbiddenError } from "@/server/domain/common/errors";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import { circleId, userId } from "@/server/domain/common/ids";

const circleParticipationRepository = {
  listByCircleId: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  removeParticipation: vi.fn(),
} satisfies CircleParticipationRepository;

const circleRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleRepository;

const accessService = createAccessServiceStub();

const service = createCircleParticipationService({
  circleParticipationRepository,
  circleRepository,
  accessService,
});

const baseCircle = () => ({
  id: circleId("circle-1"),
  name: "Circle One",
  createdAt: new Date(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(circleRepository.findById).mockResolvedValue(baseCircle());
  vi.mocked(accessService.canViewCircle).mockResolvedValue(true);
  vi.mocked(accessService.canWithdrawFromCircle).mockResolvedValue(true);
  vi.mocked(accessService.canListOwnCircles).mockResolvedValue(true);
  vi.mocked(accessService.canAddCircleMember).mockResolvedValue(true);
  vi.mocked(accessService.canChangeCircleMemberRole).mockResolvedValue(true);
  vi.mocked(accessService.canTransferCircleOwnership).mockResolvedValue(true);
  vi.mocked(accessService.canRemoveCircleMember).mockResolvedValue(true);
});

describe("Circle 参加関係サービス", () => {
  describe("認可拒否時のエラー", () => {
    test("listByCircleId は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canViewCircle).mockResolvedValue(false);

      await expect(
        service.listByCircleId({
          actorId: "user-actor",
          circleId: circleId("circle-1"),
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleParticipationRepository.listByCircleId,
      ).not.toHaveBeenCalled();
    });

    test("addParticipation は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canAddCircleMember).mockResolvedValue(false);

      await expect(
        service.addParticipation({
          actorId: "user-actor",
          circleId: circleId("circle-1"),
          userId: userId("user-1"),
          role: "CircleMember",
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleParticipationRepository.addParticipation,
      ).not.toHaveBeenCalled();
    });
  });

  test("listByCircleId は一覧を返す", async () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    vi.mocked(
      circleParticipationRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt,
      },
    ]);

    const result = await service.listByCircleId({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
    });

    expect(circleParticipationRepository.listByCircleId).toHaveBeenCalledWith(
      circleId("circle-1"),
    );
    expect(result).toEqual([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt,
      },
    ]);
  });

  test("listByUserId は所属研究会の概要を返す", async () => {
    vi.mocked(circleParticipationRepository.listByUserId).mockResolvedValueOnce(
      [
        {
          circleId: circleId("circle-1"),
          userId: userId("user-1"),
          role: "CircleOwner",
          createdAt: new Date("2025-01-01T00:00:00Z"),
        },
        {
          circleId: circleId("circle-2"),
          userId: userId("user-1"),
          role: "CircleMember",
          createdAt: new Date("2025-01-02T00:00:00Z"),
        },
      ],
    );
    vi.mocked(circleRepository.findByIds).mockResolvedValueOnce([
      {
        id: circleId("circle-1"),
        name: "Circle One",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
      {
        id: circleId("circle-2"),
        name: "Circle Two",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);

    const result = await service.listByUserId({
      actorId: "user-1",
      userId: userId("user-1"),
    });

    expect(circleParticipationRepository.listByUserId).toHaveBeenCalledWith(
      userId("user-1"),
    );
    expect(circleRepository.findByIds).toHaveBeenCalledWith([
      circleId("circle-1"),
      circleId("circle-2"),
    ]);
    expect(result).toEqual([
      {
        circleId: circleId("circle-1"),
        circleName: "Circle One",
        role: "CircleOwner",
      },
      {
        circleId: circleId("circle-2"),
        circleName: "Circle Two",
        role: "CircleMember",
      },
    ]);
  });

  test("listByUserId は研究会が欠けているとエラー", async () => {
    vi.mocked(circleParticipationRepository.listByUserId).mockResolvedValueOnce(
      [
        {
          circleId: circleId("circle-1"),
          userId: userId("user-1"),
          role: "CircleOwner",
          createdAt: new Date("2025-01-01T00:00:00Z"),
        },
      ],
    );
    vi.mocked(circleRepository.findByIds).mockResolvedValueOnce([]);

    await expect(
      service.listByUserId({
        actorId: "user-1",
        userId: userId("user-1"),
      }),
    ).rejects.toThrow("Circle not found");
  });

  test("addParticipation は Owner がいない状態で Member を拒否する", async () => {
    vi.mocked(
      circleParticipationRepository.listByCircleId,
    ).mockResolvedValueOnce([]);

    await expect(
      service.addParticipation({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
      }),
    ).rejects.toThrow("Circle must have exactly one owner");

    expect(
      circleParticipationRepository.addParticipation,
    ).not.toHaveBeenCalled();
  });

  test("changeParticipationRole は Owner への変更を拒否する", async () => {
    vi.mocked(
      circleParticipationRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    await expect(
      service.changeParticipationRole({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
      }),
    ).rejects.toThrow("Use transferOwnership to assign owner");
  });

  test("transferOwnership は Owner を移譲する", async () => {
    vi.mocked(
      circleParticipationRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
      {
        circleId: circleId("circle-1"),
        userId: userId("user-2"),
        role: "CircleMember",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);

    await service.transferOwnership({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
      fromUserId: userId("user-1"),
      toUserId: userId("user-2"),
    });

    expect(
      circleParticipationRepository.updateParticipationRole,
    ).toHaveBeenCalledWith(
      circleId("circle-1"),
      userId("user-1"),
      "CircleManager",
    );
    expect(
      circleParticipationRepository.updateParticipationRole,
    ).toHaveBeenCalledWith(
      circleId("circle-1"),
      userId("user-2"),
      "CircleOwner",
    );
  });

  describe("withdrawParticipation（自己脱退）", () => {
    test("Manager は脱退できる", async () => {
      vi.mocked(
        circleParticipationRepository.listByCircleId,
      ).mockResolvedValueOnce([
        {
          circleId: circleId("circle-1"),
          userId: userId("user-owner"),
          role: "CircleOwner",
          createdAt: new Date("2025-01-01T00:00:00Z"),
        },
        {
          circleId: circleId("circle-1"),
          userId: userId("user-manager"),
          role: "CircleManager",
          createdAt: new Date("2025-01-02T00:00:00Z"),
        },
      ]);

      await service.withdrawParticipation({
        actorId: "user-manager",
        circleId: circleId("circle-1"),
      });

      expect(
        circleParticipationRepository.removeParticipation,
      ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-manager"));
    });

    test("Member は脱退できる", async () => {
      vi.mocked(
        circleParticipationRepository.listByCircleId,
      ).mockResolvedValueOnce([
        {
          circleId: circleId("circle-1"),
          userId: userId("user-owner"),
          role: "CircleOwner",
          createdAt: new Date("2025-01-01T00:00:00Z"),
        },
        {
          circleId: circleId("circle-1"),
          userId: userId("user-member"),
          role: "CircleMember",
          createdAt: new Date("2025-01-02T00:00:00Z"),
        },
      ]);

      await service.withdrawParticipation({
        actorId: "user-member",
        circleId: circleId("circle-1"),
      });

      expect(
        circleParticipationRepository.removeParticipation,
      ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-member"));
    });

    test("Owner は脱退を拒否される", async () => {
      vi.mocked(
        circleParticipationRepository.listByCircleId,
      ).mockResolvedValueOnce([
        {
          circleId: circleId("circle-1"),
          userId: userId("user-owner"),
          role: "CircleOwner",
          createdAt: new Date("2025-01-01T00:00:00Z"),
        },
      ]);

      await expect(
        service.withdrawParticipation({
          actorId: "user-owner",
          circleId: circleId("circle-1"),
        }),
      ).rejects.toThrow(
        "Owner cannot withdraw from circle. Use transferOwnership instead",
      );

      expect(
        circleParticipationRepository.removeParticipation,
      ).not.toHaveBeenCalled();
    });

    test("非メンバーは Forbidden エラー", async () => {
      vi.mocked(accessService.canWithdrawFromCircle).mockResolvedValue(false);

      await expect(
        service.withdrawParticipation({
          actorId: "user-stranger",
          circleId: circleId("circle-1"),
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleParticipationRepository.removeParticipation,
      ).not.toHaveBeenCalled();
    });

    test("Circle が存在しない場合は NotFound エラー", async () => {
      vi.mocked(circleRepository.findById).mockResolvedValueOnce(null);

      await expect(
        service.withdrawParticipation({
          actorId: "user-actor",
          circleId: circleId("circle-999"),
        }),
      ).rejects.toThrow("Circle not found");

      expect(
        circleParticipationRepository.removeParticipation,
      ).not.toHaveBeenCalled();
    });
  });

  test("removeParticipation は Owner の削除を拒否する", async () => {
    vi.mocked(circleParticipationRepository.listByCircleId).mockResolvedValue([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    await expect(
      service.removeParticipation({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
      }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      service.removeParticipation({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
      }),
    ).rejects.toThrow("Use transferOwnership to remove owner");

    expect(
      circleParticipationRepository.removeParticipation,
    ).not.toHaveBeenCalled();
  });

  test("removeParticipation は Owner 以外を削除できる", async () => {
    vi.mocked(
      circleParticipationRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
      {
        circleId: circleId("circle-1"),
        userId: userId("user-2"),
        role: "CircleMember",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ]);

    await service.removeParticipation({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
      userId: userId("user-2"),
    });

    expect(
      circleParticipationRepository.removeParticipation,
    ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-2"));
  });
});
