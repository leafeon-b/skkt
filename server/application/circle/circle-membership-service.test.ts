import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleMembershipService } from "@/server/application/circle/circle-membership-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createInMemoryCircleRepository,
  createInMemoryRepositories,
} from "@/server/infrastructure/repository/in-memory";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "@/server/domain/common/errors";
import { toCircleId, toUserId } from "@/server/domain/common/ids";

async function expectReject<T extends Error>(
  promise: Promise<unknown>,
  errorClass: new (...args: never[]) => T,
  message: string,
) {
  let caught: unknown;
  try {
    await promise;
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(errorClass);
  expect(caught).toHaveProperty("message", message);
}

const circleRepository = createInMemoryCircleRepository();

const accessService = createAccessServiceStub();

const service = createCircleMembershipService({
  circleRepository,
  accessService,
});

const baseCircle = () => ({
  id: toCircleId("circle-1"),
  name: "Circle One",
  createdAt: new Date(),
  sessionEmailNotificationEnabled: true,
});

beforeEach(async () => {
  circleRepository._clear();
  vi.clearAllMocks();
  await circleRepository.save(baseCircle());
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
          circleId: toCircleId("circle-1"),
        }),
      ).rejects.toThrow("Forbidden");
    });

    test("addMembership は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canAddCircleMember).mockResolvedValue(false);

      await expect(
        service.addMembership({
          actorId: "user-actor",
          circleId: toCircleId("circle-1"),
          userId: toUserId("user-1"),
          role: "CircleMember",
        }),
      ).rejects.toThrow("Forbidden");

      const memberships = await circleRepository.listMembershipsByCircleId(
        toCircleId("circle-1"),
      );
      expect(memberships).toHaveLength(0);
    });
  });

  test("listByCircleId は一覧を返す", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleOwner",
    );

    const result = await service.listByCircleId({
      actorId: "user-actor",
      circleId: toCircleId("circle-1"),
    });

    expect(result).toHaveLength(1);
    expect(result[0].circleId).toBe(toCircleId("circle-1"));
    expect(result[0].userId).toBe(toUserId("user-1"));
    expect(result[0].role).toBe("CircleOwner");
  });

  test("listByUserId は所属研究会の概要を返す", async () => {
    await circleRepository.save({
      id: toCircleId("circle-2"),
      name: "Circle Two",
      createdAt: new Date("2025-01-02T00:00:00Z"),
      sessionEmailNotificationEnabled: true,
    });
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleOwner",
    );
    await circleRepository.addMembership(
      toCircleId("circle-2"),
      toUserId("user-1"),
      "CircleMember",
    );

    const result = await service.listByUserId({
      actorId: "user-1",
      userId: toUserId("user-1"),
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        {
          circleId: toCircleId("circle-1"),
          circleName: "Circle One",
          role: "CircleOwner",
        },
        {
          circleId: toCircleId("circle-2"),
          circleName: "Circle Two",
          role: "CircleMember",
        },
      ]),
    );
  });

  test("listByUserId は研究会が欠けているとエラー", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleOwner",
    );
    circleRepository._circleStore.clear();

    await expect(
      service.listByUserId({
        actorId: "user-1",
        userId: toUserId("user-1"),
      }),
    ).rejects.toThrow("Circle not found");
  });

  test("addMembership は論理削除済みユーザーを再加入できる", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-owner"),
      "CircleOwner",
    );

    const result = await service.addMembership({
      actorId: "user-actor",
      circleId: toCircleId("circle-1"),
      userId: toUserId("user-rejoining"),
      role: "CircleMember",
    });

    expect(result).toBeUndefined();
    const memberships = await circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(2);
    const rejoined = memberships.find((m) => m.userId === "user-rejoining");
    expect(rejoined?.role).toBe("CircleMember");
  });

  test("addMembership は既存メンバーの重複追加で ConflictError", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleOwner",
    );

    await expect(
      service.addMembership({
        actorId: "user-actor",
        circleId: toCircleId("circle-1"),
        userId: toUserId("user-1"),
        role: "CircleMember",
      }),
    ).rejects.toThrow(ConflictError);

    const memberships = await circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(1);
  });

  test("addMembership は Owner がいない状態で Member を拒否する", async () => {
    await expectReject(
      service.addMembership({
        actorId: "user-actor",
        circleId: toCircleId("circle-1"),
        userId: toUserId("user-1"),
        role: "CircleMember",
      }),
      BadRequestError,
      "Circle must have exactly one owner",
    );

    const memberships = await circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(0);
  });

  test("changeMembershipRole は Owner への変更を拒否する", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleMember",
    );

    await expect(
      service.changeMembershipRole({
        actorId: "user-actor",
        circleId: toCircleId("circle-1"),
        userId: toUserId("user-1"),
        role: "CircleOwner",
      }),
    ).rejects.toThrow("Use transferOwnership to assign owner");
  });

  test("transferOwnership は Owner を移譲する", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleOwner",
    );
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-2"),
      "CircleMember",
    );

    await service.transferOwnership({
      actorId: "user-actor",
      circleId: toCircleId("circle-1"),
      fromUserId: toUserId("user-1"),
      toUserId: toUserId("user-2"),
    });

    const memberships = await circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    const user1 = memberships.find((m) => m.userId === "user-1");
    const user2 = memberships.find((m) => m.userId === "user-2");
    expect(user1?.role).toBe("CircleManager");
    expect(user2?.role).toBe("CircleOwner");
  });

  describe("withdrawMembership（自己退会）", () => {
    test("Manager は退会できる", async () => {
      await circleRepository.addMembership(
        toCircleId("circle-1"),
        toUserId("user-owner"),
        "CircleOwner",
      );
      await circleRepository.addMembership(
        toCircleId("circle-1"),
        toUserId("user-manager"),
        "CircleManager",
      );

      await service.withdrawMembership({
        actorId: "user-manager",
        circleId: toCircleId("circle-1"),
      });

      const memberships = await circleRepository.listMembershipsByCircleId(
        toCircleId("circle-1"),
      );
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe("user-owner");
    });

    test("Member は退会できる", async () => {
      await circleRepository.addMembership(
        toCircleId("circle-1"),
        toUserId("user-owner"),
        "CircleOwner",
      );
      await circleRepository.addMembership(
        toCircleId("circle-1"),
        toUserId("user-member"),
        "CircleMember",
      );

      await service.withdrawMembership({
        actorId: "user-member",
        circleId: toCircleId("circle-1"),
      });

      const memberships = await circleRepository.listMembershipsByCircleId(
        toCircleId("circle-1"),
      );
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe("user-owner");
    });

    test("Owner は退会を拒否される", async () => {
      await circleRepository.addMembership(
        toCircleId("circle-1"),
        toUserId("user-owner"),
        "CircleOwner",
      );

      await expect(
        service.withdrawMembership({
          actorId: "user-owner",
          circleId: toCircleId("circle-1"),
        }),
      ).rejects.toThrow(
        "Owner cannot withdraw from circle. Use transferOwnership instead",
      );

      const memberships = await circleRepository.listMembershipsByCircleId(
        toCircleId("circle-1"),
      );
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe("user-owner");
    });

    test("非メンバーは Forbidden エラー", async () => {
      vi.mocked(accessService.canWithdrawFromCircle).mockResolvedValue(false);

      await expect(
        service.withdrawMembership({
          actorId: "user-stranger",
          circleId: toCircleId("circle-1"),
        }),
      ).rejects.toThrow("Forbidden");
    });

    test("Circle が存在しない場合は NotFound エラー", async () => {
      await expect(
        service.withdrawMembership({
          actorId: "user-actor",
          circleId: toCircleId("circle-999"),
        }),
      ).rejects.toThrow("Circle not found");
    });
  });

  test("removeMembership は Owner の削除を拒否する", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleOwner",
    );

    await expectReject(
      service.removeMembership({
        actorId: "user-actor",
        circleId: toCircleId("circle-1"),
        userId: toUserId("user-1"),
      }),
      ForbiddenError,
      "Use transferOwnership to remove owner",
    );

    const memberships = await circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(1);
  });

  test("removeMembership は Owner 以外を削除できる", async () => {
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-1"),
      "CircleOwner",
    );
    await circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-2"),
      "CircleMember",
    );

    await service.removeMembership({
      actorId: "user-actor",
      circleId: toCircleId("circle-1"),
      userId: toUserId("user-2"),
    });

    const memberships = await circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe("user-1");
  });
});

describe("UnitOfWork 経路", () => {
  const { repos, unitOfWork, stores } = createInMemoryRepositories();

  const uowAccessService = createAccessServiceStub();

  const uowService = createCircleMembershipService({
    circleRepository: repos.circleRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  beforeEach(async () => {
    stores.circleStore.clear();
    stores.circleMembershipStore.clear();
    vi.clearAllMocks();
    await repos.circleRepository.save({
      id: toCircleId("circle-1"),
      name: "Circle One",
      createdAt: new Date(),
      sessionEmailNotificationEnabled: true,
    });
    await repos.circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-owner"),
      "CircleOwner",
    );
    await repos.circleRepository.addMembership(
      toCircleId("circle-1"),
      toUserId("user-member"),
      "CircleMember",
    );
    vi.mocked(uowAccessService.canWithdrawFromCircle).mockResolvedValue(true);
    vi.mocked(uowAccessService.canRemoveCircleMember).mockResolvedValue(true);
  });

  test("withdrawMembership は UoW 経由でメンバーシップを削除する", async () => {
    await uowService.withdrawMembership({
      actorId: "user-member",
      circleId: toCircleId("circle-1"),
    });

    const memberships = await repos.circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe("user-owner");
  });

  test("removeMembership は UoW 経由でメンバーシップを削除する", async () => {
    await uowService.removeMembership({
      actorId: "user-actor",
      circleId: toCircleId("circle-1"),
      userId: toUserId("user-member"),
    });

    const memberships = await repos.circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe("user-owner");
  });

  test("存在しないメンバーの removeMembership は NotFound エラー", async () => {
    await expect(
      uowService.removeMembership({
        actorId: "user-actor",
        circleId: toCircleId("circle-1"),
        userId: toUserId("user-nonexistent"),
      }),
    ).rejects.toThrow("Membership not found");
  });
});
