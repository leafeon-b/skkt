import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleParticipationService } from "@/server/application/circle/circle-participation-service";
import type { UnitOfWork } from "@/server/application/common/unit-of-work";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import { ConflictError, ForbiddenError } from "@/server/domain/common/errors";
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

  test("addParticipation は論理削除済みユーザーを再加入できる", async () => {
    // listByCircleId はアクティブメンバーのみ返す（論理削除済みユーザーは含まれない）
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

    const result = await service.addParticipation({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
      userId: userId("user-rejoining"),
      role: "CircleMember",
    });

    expect(result).toBeUndefined();
    expect(
      circleParticipationRepository.addParticipation,
    ).toHaveBeenCalledWith(
      circleId("circle-1"),
      userId("user-rejoining"),
      "CircleMember",
    );
  });

  test("addParticipation は既存メンバーの重複追加で ConflictError", async () => {
    vi.mocked(
      circleParticipationRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    await expect(
      service.addParticipation({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
      }),
    ).rejects.toThrow(ConflictError);

    expect(
      circleParticipationRepository.addParticipation,
    ).not.toHaveBeenCalled();
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

  describe("withdrawParticipation（自己退会）", () => {
    test("Manager は退会できる", async () => {
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

    test("Member は退会できる", async () => {
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

    test("Owner は退会を拒否される", async () => {
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

describe("UnitOfWork 経路", () => {
  // deps用リポジトリ（UoW外）— circleRepository はUoW外で使われるため通常設定
  const depsCircleRepository = {
    findById: vi.fn(),
    findByIds: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  } satisfies CircleRepository;

  // deps用（UoW内で使われるべきメソッドには mockResolvedValue を設定しない）
  const depsCircleParticipationRepository = {
    listByCircleId: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    updateParticipationRole: vi.fn(),
    removeParticipation: vi.fn(),
  } satisfies CircleParticipationRepository;

  // UoWコールバック用リポジトリ（UoW内専用）
  const uowCircleParticipationRepository = {
    listByCircleId: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    updateParticipationRole: vi.fn(),
    removeParticipation: vi.fn(),
  } satisfies CircleParticipationRepository;

  const unitOfWork: UnitOfWork = vi.fn(async (op) =>
    op({
      circleParticipationRepository: uowCircleParticipationRepository,
    } as never),
  );

  const uowAccessService = createAccessServiceStub();

  const uowService = createCircleParticipationService({
    circleParticipationRepository: depsCircleParticipationRepository,
    circleRepository: depsCircleRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(depsCircleRepository.findById).mockResolvedValue({
      id: circleId("circle-1"),
      name: "Circle One",
      createdAt: new Date(),
    });
    vi.mocked(uowAccessService.canWithdrawFromCircle).mockResolvedValue(true);
    vi.mocked(uowAccessService.canRemoveCircleMember).mockResolvedValue(true);
    // listByCircleId はUoW外で呼ばれるためdeps側に設定
    vi.mocked(
      depsCircleParticipationRepository.listByCircleId,
    ).mockResolvedValue([
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
  });

  test("withdrawParticipation は unitOfWork を呼び出す", async () => {
    await uowService.withdrawParticipation({
      actorId: "user-member",
      circleId: circleId("circle-1"),
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(
      uowCircleParticipationRepository.removeParticipation,
    ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-member"));
    // deps側のリポジトリは呼ばれない
    expect(
      depsCircleParticipationRepository.removeParticipation,
    ).not.toHaveBeenCalled();
  });

  test("removeParticipation は unitOfWork を呼び出す", async () => {
    await uowService.removeParticipation({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
      userId: userId("user-member"),
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(
      uowCircleParticipationRepository.removeParticipation,
    ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-member"));
    expect(
      depsCircleParticipationRepository.removeParticipation,
    ).not.toHaveBeenCalled();
  });

  test("UoW 内でエラーが発生した場合に伝播する", async () => {
    uowCircleParticipationRepository.removeParticipation.mockRejectedValue(
      new Error("DB error"),
    );

    await expect(
      uowService.withdrawParticipation({
        actorId: "user-member",
        circleId: circleId("circle-1"),
      }),
    ).rejects.toThrow("DB error");
  });
});
