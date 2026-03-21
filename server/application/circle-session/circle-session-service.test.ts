import { createCircleSessionService } from "@/server/application/circle-session/circle-session-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createInMemoryCircleRepository,
  createInMemoryCircleSessionRepository,
  createInMemoryRepositories,
} from "@/server/infrastructure/repository/in-memory";
import { toCircleId, toCircleSessionId, toUserId } from "@/server/domain/common/ids";
import {
  CIRCLE_SESSION_NOTE_MAX_LENGTH,
  CIRCLE_SESSION_TITLE_MAX_LENGTH,
  createCircleSession,
} from "@/server/domain/models/circle-session/circle-session";
import { createCircle } from "@/server/domain/models/circle/circle";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createFakeNotificationService } from "@/server/application/test-helpers/fake-notification-service";

const circleRepository = createInMemoryCircleRepository();

const circleSessionRepository = createInMemoryCircleSessionRepository();

const accessService = createAccessServiceStub();

const service = createCircleSessionService({
  circleRepository,
  circleSessionRepository,
  accessService,
});

const baseCircle = createCircle({
  id: toCircleId("circle-1"),
  name: "Home",
  createdAt: new Date("2024-01-01T00:00:00Z"),
});

const baseSessionParams = {
  id: toCircleSessionId("session-1"),
  circleId: baseCircle.id,
  title: "第1回 研究会",
  startsAt: new Date("2024-01-01T00:00:00Z"),
  endsAt: new Date("2024-01-02T00:00:00Z"),
  location: "Tokyo",
  note: "メモ",
};

beforeEach(async () => {
  circleRepository._clear();
  circleSessionRepository._clear();
  vi.clearAllMocks();
  await circleRepository.save(baseCircle);
  vi.mocked(accessService.canCreateCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canEditCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canViewCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canDeleteCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canViewCircle).mockResolvedValue(true);
});

describe("CircleSession サービス", () => {
  describe("認可拒否時のエラー", () => {
    test("createCircleSession は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canCreateCircleSession).mockResolvedValue(false);

      await expect(
        service.createCircleSession({
          actorId: "user-1",
          ...baseSessionParams,
        }),
      ).rejects.toThrow("Forbidden");

      const saved = await circleSessionRepository.findById(
        baseSessionParams.id,
      );
      expect(saved).toBeNull();
    });

    test("rescheduleCircleSession は認可拒否時に Forbidden エラー", async () => {
      const existing = createCircleSession({
        ...baseSessionParams,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      });
      await circleSessionRepository.save(existing);
      vi.mocked(accessService.canEditCircleSession).mockResolvedValue(false);

      await expect(
        service.rescheduleCircleSession(
          "user-1",
          existing.id,
          new Date("2024-02-01T00:00:00Z"),
          new Date("2024-02-02T00:00:00Z"),
        ),
      ).rejects.toThrow("Forbidden");

      const saved = await circleSessionRepository.findById(existing.id);
      expect(saved?.startsAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });
  });

  test("createCircleSession は研究会が存在しないとエラー", async () => {
    circleRepository._circleStore.clear();

    await expect(
      service.createCircleSession({
        actorId: "user-1",
        ...baseSessionParams,
      }),
    ).rejects.toThrow("Circle not found");

    const saved = await circleSessionRepository.findById(baseSessionParams.id);
    expect(saved).toBeNull();
  });

  test("createCircleSession はセッションを保存する", async () => {
    const session = await service.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    const saved = await circleSessionRepository.findById(session.id);
    expect(saved).toEqual(session);
  });

  test("updateCircleSessionDetails は開始・終了が片方だけだとエラー", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    await circleSessionRepository.save(existing);

    await expect(
      service.updateCircleSessionDetails("user-1", existing.id, {
        startsAt: new Date("2024-02-01T00:00:00Z"),
      }),
    ).rejects.toThrow("startsAt and endsAt must both be provided");
  });

  test("rescheduleCircleSession は更新を保存する", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    await circleSessionRepository.save(existing);

    const updated = await service.rescheduleCircleSession(
      "user-1",
      existing.id,
      new Date("2024-02-01T00:00:00Z"),
      new Date("2024-02-02T00:00:00Z"),
    );

    const saved = await circleSessionRepository.findById(existing.id);
    expect(saved).toEqual(updated);
    expect(updated.startsAt.toISOString()).toBe("2024-02-01T00:00:00.000Z");
  });

  test("updateCircleSessionDetails はタイトルが最大文字数超過時にエラー", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    await circleSessionRepository.save(existing);

    await expect(
      service.updateCircleSessionDetails("user-1", existing.id, {
        title: "a".repeat(CIRCLE_SESSION_TITLE_MAX_LENGTH + 1),
      }),
    ).rejects.toThrow(
      `CircleSession title must be at most ${CIRCLE_SESSION_TITLE_MAX_LENGTH} characters`,
    );

    const saved = await circleSessionRepository.findById(existing.id);
    expect(saved?.title).toBe(existing.title);
  });

  test("updateCircleSessionDetails はノートが最大文字数超過時にエラー", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    await circleSessionRepository.save(existing);

    await expect(
      service.updateCircleSessionDetails("user-1", existing.id, {
        note: "a".repeat(CIRCLE_SESSION_NOTE_MAX_LENGTH + 1),
      }),
    ).rejects.toThrow(
      `CircleSession note must be at most ${CIRCLE_SESSION_NOTE_MAX_LENGTH} characters`,
    );

    const saved = await circleSessionRepository.findById(existing.id);
    expect(saved?.note).toBe(existing.note);
  });

  test("updateCircleSessionDetails はタイトル・場所・メモを更新する", async () => {
    const existing = createCircleSession({
      ...baseSessionParams,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    await circleSessionRepository.save(existing);

    const updated = await service.updateCircleSessionDetails(
      "user-1",
      existing.id,
      {
        title: "更新後タイトル",
        location: "Osaka",
        note: "更新後メモ",
      },
    );

    const saved = await circleSessionRepository.findById(existing.id);
    expect(saved).toEqual(updated);
    expect(updated.title).toBe("更新後タイトル");
    expect(updated.location).toBe("Osaka");
    expect(updated.note).toBe("更新後メモ");
  });

  describe("セッション作成時の自動参加登録", () => {
    test("createCircleSession は作成者を CircleSessionOwner として参加登録する", async () => {
      await service.createCircleSession({
        actorId: "user-1",
        ...baseSessionParams,
      });

      const memberships = await circleSessionRepository.listMemberships(
        baseSessionParams.id,
      );
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe(toUserId("user-1"));
      expect(memberships[0].role).toBe("CircleSessionOwner");
    });

    test("認可失敗時は参加登録されない", async () => {
      vi.mocked(accessService.canCreateCircleSession).mockResolvedValue(false);

      await expect(
        service.createCircleSession({
          actorId: "user-1",
          ...baseSessionParams,
        }),
      ).rejects.toThrow("Forbidden");

      const memberships = await circleSessionRepository.listMemberships(
        baseSessionParams.id,
      );
      expect(memberships).toHaveLength(0);
    });

    test("研究会が存在しない場合は参加登録されない", async () => {
      circleRepository._circleStore.clear();

      await expect(
        service.createCircleSession({
          actorId: "user-1",
          ...baseSessionParams,
        }),
      ).rejects.toThrow("Circle not found");

      const memberships = await circleSessionRepository.listMemberships(
        baseSessionParams.id,
      );
      expect(memberships).toHaveLength(0);
    });
  });
});

describe("UnitOfWork 経路", () => {
  const { repos, unitOfWork, stores } = createInMemoryRepositories();

  const uowAccessService = createAccessServiceStub();

  const uowService = createCircleSessionService({
    circleRepository: repos.circleRepository,
    circleSessionRepository: repos.circleSessionRepository,
    accessService: uowAccessService,
    unitOfWork,
  });

  const uowBaseCircle = createCircle({
    id: toCircleId("circle-1"),
    name: "Home",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  });

  beforeEach(async () => {
    stores.circleStore.clear();
    stores.circleMembershipStore.clear();
    stores.circleSessionStore.clear();
    stores.circleSessionMembershipStore.clear();
    vi.clearAllMocks();
    vi.mocked(uowAccessService.canCreateCircleSession).mockResolvedValue(true);
    await repos.circleRepository.save(uowBaseCircle);
  });

  test("createCircleSession は UoW 経由でセッションとオーナーメンバーシップを保存する", async () => {
    const session = await uowService.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    const saved = await repos.circleSessionRepository.findById(session.id);
    expect(saved).toEqual(session);
    const memberships = await repos.circleSessionRepository.listMemberships(
      session.id,
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe(toUserId("user-1"));
    expect(memberships[0].role).toBe("CircleSessionOwner");
  });

  test("UoW 内で重複メンバーシップ追加時にエラーが伝播する", async () => {
    await uowService.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    await expect(
      uowService.createCircleSession({
        actorId: "user-1",
        ...baseSessionParams,
      }),
    ).rejects.toThrow("Membership already exists");
  });
});

describe("セッション作成時のメール通知", () => {
  const fakeNotificationService = createFakeNotificationService();

  const notifyCircleRepo = createInMemoryCircleRepository();
  const notifySessionRepo = createInMemoryCircleSessionRepository();
  const notifyAccessService = createAccessServiceStub();

  const notifyService = createCircleSessionService({
    circleRepository: notifyCircleRepo,
    circleSessionRepository: notifySessionRepo,
    accessService: notifyAccessService,
    notificationService: fakeNotificationService,
  });

  beforeEach(async () => {
    notifyCircleRepo._clear();
    notifySessionRepo._clear();
    fakeNotificationService.notifications.length = 0;
    vi.clearAllMocks();
    await notifyCircleRepo.save(baseCircle);
    vi.mocked(notifyAccessService.canCreateCircleSession).mockResolvedValue(
      true,
    );
  });

  test("セッション作成時に通知が呼ばれる", async () => {
    await notifyService.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    expect(fakeNotificationService.notifications).toHaveLength(1);
    expect(fakeNotificationService.notifications[0].session.id).toBe(baseSessionParams.id);
    expect(fakeNotificationService.notifications[0].circleName).toBe(baseCircle.name);
    expect(fakeNotificationService.notifications[0].actorId).toBe("user-1");
  });

  test("メール送信失敗時もセッション作成は成功する", async () => {
    fakeNotificationService.failOnNextCall(new Error("email error"));

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const session = await notifyService.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    expect(session).toBeDefined();
    const saved = await notifySessionRepo.findById(session.id);
    expect(saved).toEqual(session);

    // Wait for the fire-and-forget promise to settle
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
