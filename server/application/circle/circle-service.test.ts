import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleService } from "@/server/application/circle/circle-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createMockCircleRepository,
  createMockUnitOfWork,
} from "@/server/application/test-helpers/mock-repositories";
import { circleId } from "@/server/domain/common/ids";
import { createCircle } from "@/server/domain/models/circle/circle";

const circleRepository = createMockCircleRepository();

const accessService = createAccessServiceStub();

const service = createCircleService({
  circleRepository,
  accessService,
});

beforeEach(() => {
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
          id: circleId("circle-1"),
          name: "Home",
          createdAt: new Date("2024-01-01T00:00:00Z"),
        }),
      ).rejects.toThrow("Forbidden");

      expect(circleRepository.save).not.toHaveBeenCalled();
    });

    test("renameCircle は認可拒否時に Forbidden エラー", async () => {
      const existing = createCircle({
        id: circleId("circle-1"),
        name: "Home",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      });
      vi.mocked(circleRepository.findById).mockResolvedValue(existing);
      vi.mocked(accessService.canEditCircle).mockResolvedValue(false);

      await expect(
        service.renameCircle("user-1", existing.id, "Next"),
      ).rejects.toThrow("Forbidden");

      expect(circleRepository.save).not.toHaveBeenCalled();
    });
  });

  test("createCircle は研究会を保存する", async () => {
    const createdAt = new Date("2024-01-01T00:00:00Z");

    const circle = await service.createCircle({
      actorId: "user-1",
      id: circleId("circle-1"),
      name: "Home",
      createdAt,
    });

    expect(circleRepository.save).toHaveBeenCalledWith(circle);
    expect(circleRepository.addMembership).toHaveBeenCalled();
    expect(circle.name).toBe("Home");
    expect(circle.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  test("renameCircle は存在しないとエラー", async () => {
    vi.mocked(circleRepository.findById).mockResolvedValue(null);

    await expect(
      service.renameCircle("user-1", circleId("circle-1"), "Next"),
    ).rejects.toThrow("Circle not found");

    expect(circleRepository.save).not.toHaveBeenCalled();
  });

  test("renameCircle は更新を保存する", async () => {
    const existing = createCircle({
      id: circleId("circle-1"),
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    vi.mocked(circleRepository.findById).mockResolvedValue(existing);

    const updated = await service.renameCircle("user-1", existing.id, "Next");

    expect(circleRepository.save).toHaveBeenCalledWith(updated);
    expect(updated.name).toBe("Next");
  });
});

describe("UnitOfWork 経路", () => {
  const depsCircleRepository = createMockCircleRepository();
  const { unitOfWork, repos } = createMockUnitOfWork();

  const uowAccessService = createAccessServiceStub();

  const uowService = createCircleService({
    circleRepository: depsCircleRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uowAccessService.canCreateCircle).mockResolvedValue(true);
  });

  test("createCircle は unitOfWork を呼び出す", async () => {
    const circle = await uowService.createCircle({
      actorId: "user-1",
      id: circleId("circle-1"),
      name: "Home",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(repos.circleRepository.save).toHaveBeenCalledWith(circle);
    expect(repos.circleRepository.addMembership).toHaveBeenCalled();
    // deps側のリポジトリは呼ばれない
    expect(depsCircleRepository.save).not.toHaveBeenCalled();
    expect(depsCircleRepository.addMembership).not.toHaveBeenCalled();
  });

  test("addMembership 失敗時にエラーが伝播する", async () => {
    vi.mocked(repos.circleRepository.addMembership).mockRejectedValue(
      new Error("DB error"),
    );

    await expect(
      uowService.createCircle({
        actorId: "user-1",
        id: circleId("circle-1"),
        name: "Home",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      }),
    ).rejects.toThrow("DB error");
  });
});
