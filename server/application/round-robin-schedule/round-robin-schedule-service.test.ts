import { beforeEach, describe, expect, test, vi } from "vitest";
import { createRoundRobinScheduleService } from "@/server/application/round-robin-schedule/round-robin-schedule-service";
import { createAccessServiceStub } from "@/server/application/test-helpers/access-service-stub";
import { createInMemoryCircleSessionRepository } from "@/server/infrastructure/repository/in-memory";
import {
  circleId,
  circleSessionId,
  userId,
} from "@/server/domain/common/ids";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import type { RoundRobinScheduleRepository } from "@/server/domain/models/round-robin-schedule/round-robin-schedule-repository";
import type { RoundRobinSchedule } from "@/server/domain/models/round-robin-schedule/round-robin-schedule";
import type { CircleSessionId } from "@/server/domain/common/ids";
import { BadRequestError, ForbiddenError } from "@/server/domain/common/errors";

const createMockRoundRobinScheduleRepository =
  (): RoundRobinScheduleRepository & {
    _store: Map<string, RoundRobinSchedule>;
  } => {
    const store = new Map<string, RoundRobinSchedule>();
    return {
      _store: store,
      async findByCircleSessionId(
        csId: CircleSessionId,
      ): Promise<RoundRobinSchedule | null> {
        return store.get(csId as string) ?? null;
      },
      async save(schedule: RoundRobinSchedule): Promise<void> {
        store.set(schedule.circleSessionId as string, schedule);
      },
      async deleteByCircleSessionId(csId: CircleSessionId): Promise<void> {
        store.delete(csId as string);
      },
    };
  };

const roundRobinScheduleRepository = createMockRoundRobinScheduleRepository();
const circleSessionRepository = createInMemoryCircleSessionRepository();
const accessService = createAccessServiceStub();

const service = createRoundRobinScheduleService({
  roundRobinScheduleRepository,
  circleSessionRepository,
  accessService,
});

const SESSION_ID = circleSessionId("session-1");
const CIRCLE_ID = circleId("circle-1");
const ACTOR_ID = userId("actor-1");

const baseSession = () =>
  createCircleSession({
    id: SESSION_ID,
    circleId: CIRCLE_ID,
    title: "第1回 研究会",
    startsAt: new Date("2024-01-01T00:00:00Z"),
    endsAt: new Date("2024-01-02T00:00:00Z"),
    location: null,
    note: "",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  });

const addMembers = async (count: number) => {
  for (let i = 1; i <= count; i++) {
    await circleSessionRepository.addMembership(
      SESSION_ID,
      userId(`user-${i}`),
      "CircleSessionMember",
    );
  }
};

beforeEach(async () => {
  roundRobinScheduleRepository._store.clear();
  circleSessionRepository._sessionStore.clear();
  circleSessionRepository._membershipStore.clear();
  vi.clearAllMocks();

  await circleSessionRepository.save(baseSession());
  vi.mocked(accessService.canManageRoundRobinSchedule).mockResolvedValue(true);
  vi.mocked(accessService.canViewRoundRobinSchedule).mockResolvedValue(true);
});

describe("RoundRobinScheduleService", () => {
  describe("generateSchedule", () => {
    test("スケジュールを生成できる（参加者からラウンドが生成され、保存される）", async () => {
      await addMembers(4);

      const result = await service.generateSchedule({
        actorId: ACTOR_ID,
        circleSessionId: SESSION_ID,
      });

      expect(result.circleSessionId).toBe(SESSION_ID);
      expect(result.rounds.length).toBeGreaterThan(0);
      expect(result.totalMatchCount).toBe(6); // 4C2 = 6
      expect(result.id).toBeTruthy();

      // 保存されていること
      const saved =
        await roundRobinScheduleRepository.findByCircleSessionId(SESSION_ID);
      expect(saved).toEqual(result);
    });

    test("既存スケジュールがある場合、削除してから再生成する", async () => {
      await addMembers(3);

      const first = await service.generateSchedule({
        actorId: ACTOR_ID,
        circleSessionId: SESSION_ID,
      });

      const second = await service.generateSchedule({
        actorId: ACTOR_ID,
        circleSessionId: SESSION_ID,
      });

      expect(second.id).not.toBe(first.id);
      const saved =
        await roundRobinScheduleRepository.findByCircleSessionId(SESSION_ID);
      expect(saved).toEqual(second);
    });

    test("参加者が2人未満の場合 BadRequestError", async () => {
      await addMembers(1);

      await expect(
        service.generateSchedule({
          actorId: ACTOR_ID,
          circleSessionId: SESSION_ID,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("生成の認可がない場合 ForbiddenError", async () => {
      vi.mocked(accessService.canManageRoundRobinSchedule).mockResolvedValue(
        false,
      );
      await addMembers(4);

      await expect(
        service.generateSchedule({
          actorId: ACTOR_ID,
          circleSessionId: SESSION_ID,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getSchedule", () => {
    test("スケジュールを取得できる", async () => {
      await addMembers(3);
      const generated = await service.generateSchedule({
        actorId: ACTOR_ID,
        circleSessionId: SESSION_ID,
      });

      const result = await service.getSchedule({
        actorId: ACTOR_ID,
        circleId: CIRCLE_ID,
        circleSessionId: SESSION_ID,
      });

      expect(result).toEqual(generated);
    });

    test("スケジュールが存在しない場合 null を返す", async () => {
      const result = await service.getSchedule({
        actorId: ACTOR_ID,
        circleId: CIRCLE_ID,
        circleSessionId: SESSION_ID,
      });

      expect(result).toBeNull();
    });

    test("取得の認可がない場合 ForbiddenError", async () => {
      vi.mocked(accessService.canViewRoundRobinSchedule).mockResolvedValue(
        false,
      );

      await expect(
        service.getSchedule({
          actorId: ACTOR_ID,
          circleId: CIRCLE_ID,
          circleSessionId: SESSION_ID,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("deleteSchedule", () => {
    test("スケジュールを削除できる", async () => {
      await addMembers(3);
      await service.generateSchedule({
        actorId: ACTOR_ID,
        circleSessionId: SESSION_ID,
      });

      await service.deleteSchedule({
        actorId: ACTOR_ID,
        circleSessionId: SESSION_ID,
      });

      const result =
        await roundRobinScheduleRepository.findByCircleSessionId(SESSION_ID);
      expect(result).toBeNull();
    });

    test("スケジュールが存在しない場合でもエラーにならない（冪等）", async () => {
      await expect(
        service.deleteSchedule({
          actorId: ACTOR_ID,
          circleSessionId: SESSION_ID,
        }),
      ).resolves.toBeUndefined();
    });

    test("削除の認可がない場合 ForbiddenError", async () => {
      vi.mocked(accessService.canManageRoundRobinSchedule).mockResolvedValue(
        false,
      );

      await expect(
        service.deleteSchedule({
          actorId: ACTOR_ID,
          circleSessionId: SESSION_ID,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
