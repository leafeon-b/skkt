import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createCircleSessionMembershipService } from "@/server/application/circle-session/circle-session-membership-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import {
  createInMemoryCircleRepository,
  createInMemoryCircleSessionRepository,
} from "@/server/infrastructure/repository/in-memory";
import { BadRequestError, ConflictError } from "@/server/domain/common/errors";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";

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
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";

const circleSessionRepository = createInMemoryCircleSessionRepository();

const circleRepository = createInMemoryCircleRepository();

const accessService = createAccessServiceStub();

const service = createCircleSessionMembershipService({
  circleRepository,
  circleSessionRepository,
  accessService,
});

const baseSession = () =>
  createCircleSession({
    id: circleSessionId("session-1"),
    circleId: circleId("circle-1"),
    title: "第1回 研究会",
    startsAt: new Date("2024-06-01T10:00:00Z"),
    endsAt: new Date("2024-06-01T12:00:00Z"),
    location: null,
    note: "",
    createdAt: new Date("2024-06-01T00:00:00Z"),
  });

beforeEach(async () => {
  circleSessionRepository._clear();
  circleRepository._clear();
  vi.clearAllMocks();
  await circleSessionRepository.save(baseSession());
  vi.mocked(accessService.canListOwnCircles).mockResolvedValue(true);
  vi.mocked(accessService.canViewCircleSession).mockResolvedValue(true);
  vi.mocked(accessService.canAddCircleSessionMember).mockResolvedValue(true);
  vi.mocked(accessService.canChangeCircleSessionMemberRole).mockResolvedValue(
    true,
  );
  vi.mocked(accessService.canTransferCircleSessionOwnership).mockResolvedValue(
    true,
  );
  vi.mocked(accessService.canRemoveCircleSessionMember).mockResolvedValue(true);
  vi.mocked(accessService.canWithdrawFromCircleSession).mockResolvedValue(true);
});

describe("CircleSession セッションメンバーシップサービス", () => {
  describe("認可拒否時のエラー", () => {
    test("listMemberships は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canViewCircleSession).mockResolvedValue(false);

      await expect(
        service.listMemberships({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).rejects.toThrow("Forbidden");
    });

    test("addMembership は認可拒否時に Forbidden エラー", async () => {
      vi.mocked(accessService.canAddCircleSessionMember).mockResolvedValue(
        false,
      );

      await expect(
        service.addMembership({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
          userId: userId("user-1"),
          role: "CircleSessionMember",
        }),
      ).rejects.toThrow("Forbidden");

      const memberships = await circleSessionRepository.listMemberships(
        circleSessionId("session-1"),
      );
      expect(memberships).toHaveLength(0);
    });
  });

  test("listMemberships は一覧を返す", async () => {
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionOwner",
    );

    const result = await service.listMemberships({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
    });

    expect(result).toHaveLength(1);
    expect(result[0].circleSessionId).toBe(circleSessionId("session-1"));
    expect(result[0].userId).toBe(userId("user-1"));
    expect(result[0].role).toBe("CircleSessionOwner");
  });

  test("addMembership は論理削除済みユーザーをセッションに再参加できる", async () => {
    await circleRepository.addMembership(
      circleId("circle-1"),
      userId("user-owner"),
      "CircleOwner",
    );
    await circleRepository.addMembership(
      circleId("circle-1"),
      userId("user-rejoining"),
      "CircleMember",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-owner"),
      "CircleSessionOwner",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-rejoining"),
      "CircleSessionMember",
    );
    await circleSessionRepository.removeMembership(
      circleSessionId("session-1"),
      userId("user-rejoining"),
      new Date(),
    );

    const result = await service.addMembership({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-rejoining"),
      role: "CircleSessionMember",
    });

    expect(result).toBeUndefined();
    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    const rejoined = memberships.find((m) => m.userId === "user-rejoining");
    expect(rejoined?.role).toBe("CircleSessionMember");
  });

  test("addMembership は既存メンバーの重複追加で ConflictError", async () => {
    await circleRepository.addMembership(
      circleId("circle-1"),
      userId("user-1"),
      "CircleMember",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionOwner",
    );

    await expect(
      service.addMembership({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      }),
    ).rejects.toThrow(ConflictError);

    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    expect(memberships).toHaveLength(1);
  });

  test("addMembership は Owner がいない状態で Member を拒否する", async () => {
    await circleRepository.addMembership(
      circleId("circle-1"),
      userId("user-1"),
      "CircleMember",
    );

    await expectReject(
      service.addMembership({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionMember",
      }),
      BadRequestError,
      "CircleSession must have exactly one owner",
    );

    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    expect(memberships).toHaveLength(0);
  });

  test("listByUserId は参加回の要約を返す", async () => {
    await circleRepository.save({
      id: circleId("circle-1"),
      name: "さくら将棋研究会",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    await circleSessionRepository.save(
      createCircleSession({
        id: circleSessionId("session-1"),
        circleId: circleId("circle-1"),
        title: "第1回 研究会",
        startsAt: new Date("2024-02-01T10:00:00Z"),
        endsAt: new Date("2024-02-01T12:00:00Z"),
        location: "さくらホール A",
        note: "",
        createdAt: new Date("2024-02-01T00:00:00Z"),
      }),
    );
    await circleSessionRepository.save(
      createCircleSession({
        id: circleSessionId("session-2"),
        circleId: circleId("circle-1"),
        title: "第2回 研究会",
        startsAt: new Date("2024-03-01T10:00:00Z"),
        endsAt: new Date("2024-03-01T12:00:00Z"),
        location: null,
        note: "",
        createdAt: new Date("2024-03-01T00:00:00Z"),
      }),
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionMember",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-2"),
      userId("user-1"),
      "CircleSessionMember",
    );

    const result = await service.listByUserId({
      actorId: "user-1",
      userId: userId("user-1"),
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.circleName).toBe("さくら将棋研究会");
    expect(result[0]?.title).toBe("第2回 研究会");
  });

  test("addMembership は研究会非メンバーかつ過去セッション参加者の再追加が成功する", async () => {
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-owner"),
      "CircleSessionOwner",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("non-circle-member"),
      "CircleSessionMember",
    );
    await circleSessionRepository.removeMembership(
      circleSessionId("session-1"),
      userId("non-circle-member"),
      new Date(),
    );

    const result = await service.addMembership({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("non-circle-member"),
      role: "CircleSessionMember",
    });

    expect(result).toBeUndefined();
    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    const rejoined = memberships.find((m) => m.userId === "non-circle-member");
    expect(rejoined?.role).toBe("CircleSessionMember");
  });

  test("addMembership は研究会非メンバーかつ過去セッション参加歴なしの追加を拒否する", async () => {
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-owner"),
      "CircleSessionOwner",
    );

    await expectReject(
      service.addMembership({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("completely-new-user"),
        role: "CircleSessionMember",
      }),
      BadRequestError,
      "User is not an active member of the circle",
    );

    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    expect(memberships).toHaveLength(1);
  });

  test("addMembership は研究会メンバーでないユーザーの追加を拒否する", async () => {
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionOwner",
    );

    await expectReject(
      service.addMembership({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("non-circle-member"),
        role: "CircleSessionMember",
      }),
      BadRequestError,
      "User is not an active member of the circle",
    );

    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    expect(memberships).toHaveLength(1);
  });

  test("addMembership は Owner がいる場合に Member を追加できる", async () => {
    await circleRepository.addMembership(
      circleId("circle-1"),
      userId("user-2"),
      "CircleMember",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionOwner",
    );

    const result = await service.addMembership({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      userId: userId("user-2"),
      role: "CircleSessionMember",
    });

    expect(result).toBeUndefined();
    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    expect(memberships).toHaveLength(2);
    const added = memberships.find((m) => m.userId === "user-2");
    expect(added?.role).toBe("CircleSessionMember");
  });

  test("changeMembershipRole は Owner への変更を拒否する", async () => {
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionMember",
    );

    await expect(
      service.changeMembershipRole({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
        role: "CircleSessionOwner",
      }),
    ).rejects.toThrow("Use transferOwnership to assign owner");
  });

  test("transferOwnership は Owner を移譲する", async () => {
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionOwner",
    );
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-2"),
      "CircleSessionMember",
    );

    await service.transferOwnership({
      actorId: "user-actor",
      circleSessionId: circleSessionId("session-1"),
      fromUserId: userId("user-1"),
      toUserId: userId("user-2"),
    });

    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    const user1 = memberships.find((m) => m.userId === "user-1");
    const user2 = memberships.find((m) => m.userId === "user-2");
    expect(user1?.role).toBe("CircleSessionManager");
    expect(user2?.role).toBe("CircleSessionOwner");
  });

  test("removeMembership は対局記録があっても削除できる", async () => {
    await circleSessionRepository.addMembership(
      circleSessionId("session-1"),
      userId("user-1"),
      "CircleSessionMember",
    );

    await expect(
      service.removeMembership({
        actorId: "user-actor",
        circleSessionId: circleSessionId("session-1"),
        userId: userId("user-1"),
      }),
    ).resolves.toBeUndefined();

    const memberships = await circleSessionRepository.listMemberships(
      circleSessionId("session-1"),
    );
    expect(memberships.find((m) => m.userId === "user-1")).toBeUndefined();
  });

  describe("withdrawMembership", () => {
    test("メンバーは退会できる", async () => {
      await circleSessionRepository.addMembership(
        circleSessionId("session-1"),
        userId("user-actor"),
        "CircleSessionMember",
      );

      await expect(
        service.withdrawMembership({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).resolves.toBeUndefined();

      const memberships = await circleSessionRepository.listMemberships(
        circleSessionId("session-1"),
      );
      expect(
        memberships.find((m) => m.userId === "user-actor"),
      ).toBeUndefined();
    });

    test("オーナーは退会できない", async () => {
      await circleSessionRepository.addMembership(
        circleSessionId("session-1"),
        userId("user-actor"),
        "CircleSessionOwner",
      );

      await expect(
        service.withdrawMembership({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).rejects.toThrow(
        "Owner cannot withdraw from session. Use transferOwnership instead",
      );

      const memberships = await circleSessionRepository.listMemberships(
        circleSessionId("session-1"),
      );
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe("user-actor");
    });

    test("対局記録があっても退会できる", async () => {
      await circleSessionRepository.addMembership(
        circleSessionId("session-1"),
        userId("user-actor"),
        "CircleSessionMember",
      );

      await expect(
        service.withdrawMembership({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).resolves.toBeUndefined();

      const memberships = await circleSessionRepository.listMemberships(
        circleSessionId("session-1"),
      );
      expect(
        memberships.find((m) => m.userId === "user-actor"),
      ).toBeUndefined();
    });

    test("非メンバーは Forbidden エラー", async () => {
      vi.mocked(accessService.canWithdrawFromCircleSession).mockResolvedValue(
        false,
      );

      await expect(
        service.withdrawMembership({
          actorId: "user-actor",
          circleSessionId: circleSessionId("session-1"),
        }),
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("countPastSessionsByUserId", () => {
    const NOW = new Date("2025-06-01T00:00:00Z");

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("参加データ0件 → 0を返す", async () => {
      const result = await service.countPastSessionsByUserId(userId("user-1"));

      expect(result).toBe(0);
    });

    test("全セッションが過去 → 全件カウント", async () => {
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("past-1"),
          circleId: circleId("circle-1"),
          title: "Past 1",
          startsAt: new Date("2025-05-01T10:00:00Z"),
          endsAt: new Date("2025-05-01T12:00:00Z"),
          createdAt: new Date("2025-04-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("past-2"),
          circleId: circleId("circle-1"),
          title: "Past 2",
          startsAt: new Date("2025-05-15T10:00:00Z"),
          endsAt: new Date("2025-05-15T12:00:00Z"),
          createdAt: new Date("2025-05-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.addMembership(
        circleSessionId("past-1"),
        userId("user-1"),
        "CircleSessionMember",
      );
      await circleSessionRepository.addMembership(
        circleSessionId("past-2"),
        userId("user-1"),
        "CircleSessionMember",
      );

      const result = await service.countPastSessionsByUserId(userId("user-1"));

      expect(result).toBe(2);
    });

    test("全セッションが未来 → 0を返す", async () => {
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("future-1"),
          circleId: circleId("circle-1"),
          title: "Future 1",
          startsAt: new Date("2025-07-01T10:00:00Z"),
          endsAt: new Date("2025-07-01T12:00:00Z"),
          createdAt: new Date("2025-06-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("future-2"),
          circleId: circleId("circle-1"),
          title: "Future 2",
          startsAt: new Date("2025-08-01T10:00:00Z"),
          endsAt: new Date("2025-08-01T12:00:00Z"),
          createdAt: new Date("2025-07-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.addMembership(
        circleSessionId("future-1"),
        userId("user-1"),
        "CircleSessionMember",
      );
      await circleSessionRepository.addMembership(
        circleSessionId("future-2"),
        userId("user-1"),
        "CircleSessionMember",
      );

      const result = await service.countPastSessionsByUserId(userId("user-1"));

      expect(result).toBe(0);
    });

    test("過去・未来混在 → 過去のみカウント", async () => {
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("past-1"),
          circleId: circleId("circle-1"),
          title: "Past 1",
          startsAt: new Date("2025-04-01T10:00:00Z"),
          endsAt: new Date("2025-04-01T12:00:00Z"),
          createdAt: new Date("2025-03-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("past-2"),
          circleId: circleId("circle-1"),
          title: "Past 2",
          startsAt: new Date("2025-05-15T10:00:00Z"),
          endsAt: new Date("2025-05-15T12:00:00Z"),
          createdAt: new Date("2025-05-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("future-1"),
          circleId: circleId("circle-1"),
          title: "Future 1",
          startsAt: new Date("2025-07-01T10:00:00Z"),
          endsAt: new Date("2025-07-01T12:00:00Z"),
          createdAt: new Date("2025-06-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.addMembership(
        circleSessionId("past-1"),
        userId("user-1"),
        "CircleSessionMember",
      );
      await circleSessionRepository.addMembership(
        circleSessionId("past-2"),
        userId("user-1"),
        "CircleSessionMember",
      );
      await circleSessionRepository.addMembership(
        circleSessionId("future-1"),
        userId("user-1"),
        "CircleSessionMember",
      );

      const result = await service.countPastSessionsByUserId(userId("user-1"));

      expect(result).toBe(2);
    });

    test("境界値: endsAt === now → 過去としてカウント", async () => {
      await circleSessionRepository.save(
        createCircleSession({
          id: circleSessionId("boundary"),
          circleId: circleId("circle-1"),
          title: "Boundary",
          startsAt: new Date("2025-05-31T22:00:00Z"),
          endsAt: new Date("2025-06-01T00:00:00Z"),
          createdAt: new Date("2025-05-01T00:00:00Z"),
        }),
      );
      await circleSessionRepository.addMembership(
        circleSessionId("boundary"),
        userId("user-1"),
        "CircleSessionMember",
      );

      const result = await service.countPastSessionsByUserId(userId("user-1"));

      expect(result).toBe(1);
    });
  });
});
