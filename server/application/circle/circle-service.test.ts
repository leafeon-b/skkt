import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleService } from "@/server/application/circle/circle-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createInMemoryCircleRepository,
  createInMemoryRepositories,
} from "@/server/infrastructure/repository/in-memory";
import { toCircleId } from "@/server/domain/common/ids";
import { createCircle } from "@/server/domain/models/circle/circle";

const circleRepository = createInMemoryCircleRepository();

const accessService = createAccessServiceStub();

const service = createCircleService({
  circleRepository,
  accessService,
});

beforeEach(() => {
  circleRepository._clear();
  vi.clearAllMocks();
  vi.mocked(accessService.canCreateCircle).mockResolvedValue(true);
  vi.mocked(accessService.canEditCircle).mockResolvedValue(true);
  vi.mocked(accessService.canViewCircle).mockResolvedValue(true);
  vi.mocked(accessService.canDeleteCircle).mockResolvedValue(true);
});

describe("Circle サービス", () => {
  describe("認可拒否時のエラー", () => {
    test("createCircle は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canCreateCircle).mockResolvedValue(false);

      await expect(
        service.createCircle({
          actorId: "user-1",
          id: toCircleId("circle-1"),
          name: "Home",
          createdAt: new Date("2024-01-01T00:00:00Z"),
        }),
      ).rejects.toThrow("Forbidden");

      const saved = await circleRepository.findById(toCircleId("circle-1"));
      expect(saved).toBeNull();
    });

    test("renameCircle は認可拒否時に Forbidden エラー", async () => {
      const existing = createCircle({
        id: toCircleId("circle-1"),
        name: "Home",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      });
      await circleRepository.save(existing);
      vi.mocked(accessService.canEditCircle).mockResolvedValue(false);

      await expect(
        service.renameCircle("user-1", existing.id, "Next"),
      ).rejects.toThrow("Forbidden");

      const saved = await circleRepository.findById(toCircleId("circle-1"));
      expect(saved?.name).toBe("Home");
    });
  });

  test("createCircle は研究会を保存する", async () => {
    const createdAt = new Date("2024-01-01T00:00:00Z");

    const circle = await service.createCircle({
      actorId: "user-1",
      id: toCircleId("circle-1"),
      name: "Home",
      createdAt,
    });

    const saved = await circleRepository.findById(toCircleId("circle-1"));
    expect(saved?.name).toBe("Home");
    const memberships = await circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe("user-1");
    expect(memberships[0].role).toBe("CircleOwner");
    expect(circle.name).toBe("Home");
    expect(circle.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  test("renameCircle は存在しないとエラー", async () => {
    await expect(
      service.renameCircle("user-1", toCircleId("circle-1"), "Next"),
    ).rejects.toThrow("Circle not found");
  });

  test("renameCircle は更新を保存する", async () => {
    const existing = createCircle({
      id: toCircleId("circle-1"),
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    await circleRepository.save(existing);

    const updated = await service.renameCircle("user-1", existing.id, "Next");

    const saved = await circleRepository.findById(toCircleId("circle-1"));
    expect(saved?.name).toBe("Next");
    expect(updated.name).toBe("Next");
  });
});

describe("UnitOfWork 経路", () => {
  const { repos, unitOfWork, stores } = createInMemoryRepositories();

  const uowAccessService = createAccessServiceStub();

  const uowService = createCircleService({
    circleRepository: repos.circleRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  beforeEach(() => {
    stores.circleStore.clear();
    stores.circleMembershipStore.clear();
    vi.clearAllMocks();
    vi.mocked(uowAccessService.canCreateCircle).mockResolvedValue(true);
  });

  test("createCircle は UoW 経由で研究会とオーナーメンバーシップを保存する", async () => {
    await uowService.createCircle({
      actorId: "user-1",
      id: toCircleId("circle-1"),
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const saved = await repos.circleRepository.findById(toCircleId("circle-1"));
    expect(saved?.name).toBe("Home");
    const memberships = await repos.circleRepository.listMembershipsByCircleId(
      toCircleId("circle-1"),
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe("user-1");
    expect(memberships[0].role).toBe("CircleOwner");
  });

  test("UoW 内で重複メンバーシップ追加時にエラーが伝播する", async () => {
    await uowService.createCircle({
      actorId: "user-1",
      id: toCircleId("circle-1"),
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    await expect(
      uowService.createCircle({
        actorId: "user-1",
        id: toCircleId("circle-1"),
        name: "Home",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      }),
    ).rejects.toThrow("Membership already exists");
  });
});
