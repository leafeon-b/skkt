import { createCircleSessionService } from "@/server/application/circle-session/circle-session-service";
import type { UnitOfWork } from "@/server/application/common/unit-of-work";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { CircleSessionParticipationRepository } from "@/server/domain/models/circle-session/circle-session-participation-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import { createCircle } from "@/server/domain/models/circle/circle";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import { CircleSessionRole } from "@/server/domain/services/authz/roles";
import { beforeEach, describe, expect, test, vi } from "vitest";

const circleRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleRepository;

const circleSessionRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
  listByCircleId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
} satisfies CircleSessionRepository;

const circleSessionParticipationRepository = {
  listParticipations: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  areUsersParticipating: vi.fn(),
  removeParticipation: vi.fn(),
} satisfies CircleSessionParticipationRepository;

const accessService = createAccessServiceStub();

const service = createCircleSessionService({
  circleRepository,
  circleSessionRepository,
  circleSessionParticipationRepository,
  accessService,
});

const baseCircle = createCircle({
  id: circleId("circle-1"),
  name: "Home",
  createdAt: new Date("2024-01-01T00:00:00Z"),
});

const baseSessionParams = {
  id: circleSessionId("session-1"),
  circleId: baseCircle.id,
  title: "第1回 研究会",
  startsAt: new Date("2024-01-01T00:00:00Z"),
  endsAt: new Date("2024-01-02T00:00:00Z"),
  location: "Tokyo",
  note: "メモ",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(accessService.canCreateCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canEditCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canViewCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canDeleteCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canViewCircle).mockResolvedValue(true);
});

describe("CircleSession サービス", () => {
  describe("認可拒否時のエラー", () => {
    test("createCircleSession は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(circleRepository.findById).mockResolvedValue(baseCircle);
      vi.mocked(accessService.canCreateCircleSession).mockResolvedValue(false);

      await expect(
        service.createCircleSession({
          actorId: "user-1",
          ...baseSessionParams,
        }),
      ).rejects.toThrow("Forbidden");

      expect(circleSessionRepository.save).not.toHaveBeenCalled();
    });

    test("rescheduleCircleSession は認可拒否時に Forbidden エラー", async () => {
      const existing = createCircleSession({
        ...baseSessionParams,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      });
      vi.mocked(circleSessionRepository.findById).mockResolvedValue(existing);
      vi.mocked(accessService.canEditCircleSession).mockResolvedValue(false);

      await expect(
        service.rescheduleCircleSession(
          "user-1",
          existing.id,
          new Date("2024-02-01T00:00:00Z"),
          new Date("2024-02-02T00:00:00Z"),
        ),
      ).rejects.toThrow("Forbidden");

      expect(circleSessionRepository.save).not.toHaveBeenCalled();
    });
  });

  test("createCircleSession は研究会が存在しないとエラー", async () => {
    vi.mocked(circleRepository.findById).mockResolvedValue(null);

    await expect(
      service.createCircleSession({
        actorId: "user-1",
        ...baseSessionParams,
      }),
    ).rejects.toThrow("Circle not found");

    expect(circleSessionRepository.save).not.toHaveBeenCalled();
  });

  test("createCircleSession はセッションを保存する", async () => {
    vi.mocked(circleRepository.findById).mockResolvedValue(baseCircle);

    const session = await service.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    expect(circleSessionRepository.save).toHaveBeenCalledWith(session);
  });

  test("updateCircleSessionDetails は開始・終了が片方だけだとエラー", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    vi.mocked(circleSessionRepository.findById).mockResolvedValue(existing);

    await expect(
      service.updateCircleSessionDetails("user-1", existing.id, {
        startsAt: new Date("2024-02-01T00:00:00Z"),
      }),
    ).rejects.toThrow("startsAt and endsAt must both be provided");

    expect(circleSessionRepository.save).not.toHaveBeenCalled();
  });

  test("rescheduleCircleSession は更新を保存する", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    vi.mocked(circleSessionRepository.findById).mockResolvedValue(existing);

    const updated = await service.rescheduleCircleSession(
      "user-1",
      existing.id,
      new Date("2024-02-01T00:00:00Z"),
      new Date("2024-02-02T00:00:00Z"),
    );

    expect(circleSessionRepository.save).toHaveBeenCalledWith(updated);
    expect(updated.startsAt.toISOString()).toBe("2024-02-01T00:00:00.000Z");
  });

  test("updateCircleSessionDetails はタイトル・場所・メモを更新する", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    vi.mocked(circleSessionRepository.findById).mockResolvedValue(existing);

    const updated = await service.updateCircleSessionDetails(
      "user-1",
      existing.id,
      {
        title: "更新後タイトル",
        location: "Osaka",
        note: "更新後メモ",
      },
    );

    expect(circleSessionRepository.save).toHaveBeenCalledWith(updated);
    expect(updated.title).toBe("更新後タイトル");
    expect(updated.location).toBe("Osaka");
    expect(updated.note).toBe("更新後メモ");
  });

  describe("セッション作成時の自動参加登録", () => {
    test("createCircleSession は作成者を CircleSessionOwner として参加登録する", async () => {
      vi.mocked(circleRepository.findById).mockResolvedValue(baseCircle);

      await service.createCircleSession({
        actorId: "user-1",
        ...baseSessionParams,
      });

      expect(
        circleSessionParticipationRepository.addParticipation,
      ).toHaveBeenCalledWith(
        baseSessionParams.id,
        userId("user-1"),
        CircleSessionRole.CircleSessionOwner,
      );
    });

    test("認可失敗時は addParticipation が呼ばれない", async () => {
      vi.mocked(circleRepository.findById).mockResolvedValue(baseCircle);
      vi.mocked(accessService.canCreateCircleSession).mockResolvedValue(false);

      await expect(
        service.createCircleSession({
          actorId: "user-1",
          ...baseSessionParams,
        }),
      ).rejects.toThrow("Forbidden");

      expect(
        circleSessionParticipationRepository.addParticipation,
      ).not.toHaveBeenCalled();
    });

    test("研究会が存在しない場合は addParticipation が呼ばれない", async () => {
      vi.mocked(circleRepository.findById).mockResolvedValue(null);

      await expect(
        service.createCircleSession({
          actorId: "user-1",
          ...baseSessionParams,
        }),
      ).rejects.toThrow("Circle not found");

      expect(
        circleSessionParticipationRepository.addParticipation,
      ).not.toHaveBeenCalled();
    });
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
  const depsCircleSessionRepository = {
    findById: vi.fn(),
    findByIds: vi.fn(),
    listByCircleId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  } satisfies CircleSessionRepository;

  const depsCircleSessionParticipationRepository = {
    listParticipations: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    updateParticipationRole: vi.fn(),
    areUsersParticipating: vi.fn(),
    removeParticipation: vi.fn(),
    } satisfies CircleSessionParticipationRepository;

  // UoWコールバック用リポジトリ（UoW内専用）
  const uowCircleSessionRepository = {
    findById: vi.fn(),
    findByIds: vi.fn(),
    listByCircleId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  } satisfies CircleSessionRepository;

  const uowCircleSessionParticipationRepository = {
    listParticipations: vi.fn(),
    listByUserId: vi.fn(),
    addParticipation: vi.fn(),
    updateParticipationRole: vi.fn(),
    areUsersParticipating: vi.fn(),
    removeParticipation: vi.fn(),
    } satisfies CircleSessionParticipationRepository;

  const unitOfWork: UnitOfWork = vi.fn(async (op) =>
    op({
      circleSessionRepository: uowCircleSessionRepository,
      circleSessionParticipationRepository:
        uowCircleSessionParticipationRepository,
    } as never),
  );

  const uowAccessService = createAccessServiceStub();

  const uowService = createCircleSessionService({
    circleRepository: depsCircleRepository,
    circleSessionRepository: depsCircleSessionRepository,
    circleSessionParticipationRepository:
      depsCircleSessionParticipationRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  const uowBaseCircle = createCircle({
    id: circleId("circle-1"),
    name: "Home",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uowAccessService.canCreateCircleSession).mockResolvedValue(true);
    vi.mocked(depsCircleRepository.findById).mockResolvedValue(uowBaseCircle);
  });

  test("createCircleSession は unitOfWork を呼び出す", async () => {
    const session = await uowService.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    expect(unitOfWork).toHaveBeenCalledOnce();
    expect(uowCircleSessionRepository.save).toHaveBeenCalledWith(session);
    expect(
      uowCircleSessionParticipationRepository.addParticipation,
    ).toHaveBeenCalled();
    // deps側のリポジトリは呼ばれない
    expect(depsCircleSessionRepository.save).not.toHaveBeenCalled();
    expect(
      depsCircleSessionParticipationRepository.addParticipation,
    ).not.toHaveBeenCalled();
  });

  test("addParticipation 失敗時にエラーが伝播する", async () => {
    uowCircleSessionParticipationRepository.addParticipation.mockRejectedValue(
      new Error("DB error"),
    );

    await expect(
      uowService.createCircleSession({
        actorId: "user-1",
        ...baseSessionParams,
      }),
    ).rejects.toThrow("DB error");
  });
});
