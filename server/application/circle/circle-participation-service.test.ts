import { beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleParticipationService } from "@/server/application/circle/circle-participation-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import type { CircleParticipationRepository } from "@/server/domain/models/circle/circle-participation-repository";
import type { CircleRepository } from "@/server/domain/models/circle/circle-repository";
import { circleId, userId } from "@/server/domain/common/ids";

const circleParticipationRepository = {
  listParticipations: vi.fn(),
  listByUserId: vi.fn(),
  addParticipation: vi.fn(),
  updateParticipationRole: vi.fn(),
  removeParticipation: vi.fn(),
} satisfies CircleParticipationRepository;

const circleRepository = {
  findById: vi.fn(),
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
  vi.mocked(accessService.canAddCircleMember).mockResolvedValue(true);
  vi.mocked(accessService.canChangeCircleMemberRole).mockResolvedValue(true);
  vi.mocked(accessService.canTransferCircleOwnership).mockResolvedValue(true);
  vi.mocked(accessService.canRemoveCircleMember).mockResolvedValue(true);
});

describe("Circle 参加関係サービス", () => {
  test("listParticipations は一覧を返す", async () => {
    vi.mocked(
      circleParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
      },
    ]);

    const result = await service.listParticipations({
      actorId: "user-actor",
      circleId: circleId("circle-1"),
    });

    expect(circleParticipationRepository.listParticipations).toHaveBeenCalledWith(
      circleId("circle-1"),
    );
    expect(result).toEqual([
      { circleId: circleId("circle-1"), userId: userId("user-1"), role: "CircleOwner" },
    ]);
  });

  test("addParticipation は Owner がいない状態で Member を拒否する", async () => {
    vi.mocked(
      circleParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([]);

    await expect(
      service.addParticipation({
        actorId: "user-actor",
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleMember",
      }),
    ).rejects.toThrow("Circle must have exactly one owner");

    expect(circleParticipationRepository.addParticipation).not.toHaveBeenCalled();
  });

  test("changeParticipationRole は Owner への変更を拒否する", async () => {
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
      circleParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
      },
      {
        circleId: circleId("circle-1"),
        userId: userId("user-2"),
        role: "CircleMember",
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

  test("removeParticipation は Owner の削除を拒否する", async () => {
    vi.mocked(
      circleParticipationRepository.listParticipations,
    ).mockResolvedValueOnce([
      {
        circleId: circleId("circle-1"),
        userId: userId("user-1"),
        role: "CircleOwner",
      },
    ]);

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
});
