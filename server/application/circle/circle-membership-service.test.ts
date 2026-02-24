import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleMembershipService } from "@/server/application/circle/circle-membership-service";
import type { UnitOfWork } from "@/server/application/common/unit-of-work";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createMockCircleMembershipRepository,
  createMockCircleRepository,
} from "@/server/application/test-helpers/mock-repositories";
import { ConflictError, ForbiddenError } from "@/server/domain/common/errors";
import { circleId, userId } from "@/server/domain/common/ids";

const circleMembershipRepository = createMockCircleMembershipRepository();

const circleRepository = createMockCircleRepository();

const accessService = createAccessServiceStub();

const service = createCircleMembershipService({
  circleMembershipRepository,
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

describe("Circle メンバーシップサービス", () => {
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
        circleMembershipRepository.listByCircleId,
      ).not.toHaveBeenCalled();
    });

    test("addMembership は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canAddCircleMember).mockResolvedValue(false);

      await expect(
        service.addMembership({
          actorId: "user-actor",
          circleId: circleId("circle-1"),
          userId: userId("user-1"),
          role: "CircleMember",
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleMembershipRepository.addMembership,
      ).not.toHaveBeenCalled();
    });
  });

  test("listByCircleId は一覧を返す", async () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    vi.mocked(
      circleMembershipRepository.listByCircleId,
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

    expect(circleMembershipRepository.listByCircleId).toHaveBeenCalledWith(
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
    vi.mocked(circleMembershipRepository.listByUserId).mockResolvedValueOnce(
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

    expect(circleMembershipRepository.listByUserId).toHaveBeenCalledWith(
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
    vi.mocked(circleMembershipRepository.listByUserId).mockResolvedValueOnce(
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

  test("addMembership は論理削除済みユーザーを再加入できる", async () => {
    // listByCircleId はアクティブメンバーのみ返す（論理削除済みユーザーは含まれない）
    vi.mocked(
      circleMembershipRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-owner"),
        role: "CircleOwner",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    const result = await service.addMembership({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
      userId: userId("user-rejoining"),
      role: "CircleMember",
    });

    expect(result).toBeUndefined();
    expect(circleMembershipRepository.addMembership).toHaveBeenCalledWith(
      circleId("circle-1"),
      userId("user-rejoining"),
      "CircleMember",
    );
  });

  test("addMembership は既存メンバーの重複追加で ConflictError", async () => {
    vi.mocked(
      circleMembershipRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    await expect(
      service.addMembership({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
      }),
    ).rejects.toThrow(ConflictError);

    expect(
      circleMembershipRepository.addMembership,
    ).not.toHaveBeenCalled();
  });

  test("addMembership は Owner がいない状態で Member を拒否する", async () => {
    vi.mocked(
      circleMembershipRepository.listByCircleId,
    ).mockResolvedValueOnce([]);

    await expect(
      service.addMembership({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
      }),
    ).rejects.toThrow("Circle must have exactly one owner");

    expect(
      circleMembershipRepository.addMembership,
    ).not.toHaveBeenCalled();
  });

  test("changeMembershipRole は Owner への変更を拒否する", async () => {
    vi.mocked(
      circleMembershipRepository.listByCircleId,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    await expect(
      service.changeMembershipRole({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
      }),
    ).rejects.toThrow("Use transferOwnership to assign owner");
  });

  test("transferOwnership は Owner を移譲する", async () => {
    vi.mocked(
      circleMembershipRepository.listByCircleId,
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
      circleMembershipRepository.updateMembershipRole,
    ).toHaveBeenCalledWith(
      circleId("circle-1"),
      userId("user-1"),
      "CircleManager",
    );
    expect(
      circleMembershipRepository.updateMembershipRole,
    ).toHaveBeenCalledWith(
      circleId("circle-1"),
      userId("user-2"),
      "CircleOwner",
    );
  });

  describe("withdrawMembership（自己退会）", () => {
    test("Manager は退会できる", async () => {
      vi.mocked(
        circleMembershipRepository.listByCircleId,
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

      await service.withdrawMembership({
        actorId: "user-manager",
        circleId: circleId("circle-1"),
      });

      expect(
        circleMembershipRepository.removeMembership,
      ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-manager"));
    });

    test("Member は退会できる", async () => {
      vi.mocked(
        circleMembershipRepository.listByCircleId,
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

      await service.withdrawMembership({
        actorId: "user-member",
        circleId: circleId("circle-1"),
      });

      expect(
        circleMembershipRepository.removeMembership,
      ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-member"));
    });

    test("Owner は退会を拒否される", async () => {
      vi.mocked(
        circleMembershipRepository.listByCircleId,
      ).mockResolvedValueOnce([
        {
          circleId: circleId("circle-1"),
          userId: userId("user-owner"),
          role: "CircleOwner",
          createdAt: new Date("2025-01-01T00:00:00Z"),
        },
      ]);

      await expect(
        service.withdrawMembership({
          actorId: "user-owner",
          circleId: circleId("circle-1"),
        }),
      ).rejects.toThrow(
        "Owner cannot withdraw from circle. Use transferOwnership instead",
      );

      expect(
        circleMembershipRepository.removeMembership,
      ).not.toHaveBeenCalled();
    });

    test("非メンバーは Forbidden エラー", async () => {
      vi.mocked(accessService.canWithdrawFromCircle).mockResolvedValue(false);

      await expect(
        service.withdrawMembership({
          actorId: "user-stranger",
          circleId: circleId("circle-1"),
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleMembershipRepository.removeMembership,
      ).not.toHaveBeenCalled();
    });

    test("Circle が存在しない場合は NotFound エラー", async () => {
      vi.mocked(circleRepository.findById).mockResolvedValueOnce(null);

      await expect(
        service.withdrawMembership({
          actorId: "user-actor",
          circleId: circleId("circle-999"),
        }),
      ).rejects.toThrow("Circle not found");

      expect(
        circleMembershipRepository.removeMembership,
      ).not.toHaveBeenCalled();
    });
  });

  test("removeMembership は Owner の削除を拒否する", async () => {
    vi.mocked(circleMembershipRepository.listByCircleId).mockResolvedValue([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    await expect(
      service.removeMembership({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
      }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      service.removeMembership({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
      }),
    ).rejects.toThrow("Use transferOwnership to remove owner");

    expect(
      circleMembershipRepository.removeMembership,
    ).not.toHaveBeenCalled();
  });

  test("removeMembership は Owner 以外を削除できる", async () => {
    vi.mocked(
      circleMembershipRepository.listByCircleId,
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

    await service.removeMembership({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
      userId: userId("user-2"),
    });

    expect(
      circleMembershipRepository.removeMembership,
    ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-2"));
  });
});

describe("UnitOfWork 経路", () => {
  // deps用リポジトリ（UoW外）— circleRepository はUoW外で使われるため通常設定
  const depsCircleRepository = createMockCircleRepository();

  // deps用（UoW内で使われるべきメソッドには mockResolvedValue を設定しない）
  const depsCircleMembershipRepository =
    createMockCircleMembershipRepository();

  // UoWコールバック用リポジトリ（UoW内専用）
  const uowCircleMembershipRepository =
    createMockCircleMembershipRepository();

  const unitOfWork: UnitOfWork = vi.fn(async (op) =>
    op({
      circleMembershipRepository: uowCircleMembershipRepository,
    } as never),
  );

  const uowAccessService = createAccessServiceStub();

  const uowService = createCircleMembershipService({
    circleMembershipRepository: depsCircleMembershipRepository,
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
      depsCircleMembershipRepository.listByCircleId,
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

  test("withdrawMembership は unitOfWork を呼び出す", async () => {
    await uowService.withdrawMembership({
      actorId: "user-member",
      circleId: circleId("circle-1"),
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(
      uowCircleMembershipRepository.removeMembership,
    ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-member"));
    // deps側のリポジトリは呼ばれない
    expect(
      depsCircleMembershipRepository.removeMembership,
    ).not.toHaveBeenCalled();
  });

  test("removeMembership は unitOfWork を呼び出す", async () => {
    await uowService.removeMembership({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
      userId: userId("user-member"),
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(
      uowCircleMembershipRepository.removeMembership,
    ).toHaveBeenCalledWith(circleId("circle-1"), userId("user-member"));
    expect(
      depsCircleMembershipRepository.removeMembership,
    ).not.toHaveBeenCalled();
  });

  test("UoW 内でエラーが発生した場合に伝播する", async () => {
    uowCircleMembershipRepository.removeMembership.mockRejectedValue(
      new Error("DB error"),
    );

    await expect(
      uowService.withdrawMembership({
        actorId: "user-member",
        circleId: circleId("circle-1"),
      }),
    ).rejects.toThrow("DB error");
  });
});
