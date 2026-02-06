import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleSessionService } from "@/server/application/circle-session/circle-session-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import type { CircleSessionRepository } from "@/server/domain/models/circle-session/circle-session-repository";
import { circleId, circleSessionId } from "@/server/domain/common/ids";
import { createCircle } from "@/server/domain/models/circle/circle";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";

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

const accessService = createAccessServiceStub();

const service = createCircleSessionService({
  circleRepository,
  circleSessionRepository,
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
  sequence: 1,
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

  test("createCircleSession は開催回を保存する", async () => {
    vi.mocked(circleRepository.findById).mockResolvedValue(baseCircle);

    const session = await service.createCircleSession({
      actorId: "user-1",
      ...baseSessionParams,
    });

    expect(circleSessionRepository.save).toHaveBeenCalledWith(session);
    expect(session.sequence).toBe(1);
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
});
