import { describe, expect, test } from "vitest";
import {
  circleSessionId,
  roundRobinScheduleId,
  userId,
} from "@/server/domain/common/ids";
import {
  createRoundRobinSchedule,
  restoreRoundRobinSchedule,
} from "@/server/domain/models/round-robin-schedule/round-robin-schedule";

describe("RoundRobinSchedule ドメイン", () => {
  test("createRoundRobinSchedule は rounds と totalMatchCount を正しく生成する", () => {
    const schedule = createRoundRobinSchedule({
      id: roundRobinScheduleId("schedule-1"),
      circleSessionId: circleSessionId("session-1"),
      participantIds: [
        userId("u1"),
        userId("u2"),
        userId("u3"),
        userId("u4"),
      ],
    });

    expect(schedule.id).toBe("schedule-1");
    expect(schedule.circleSessionId).toBe("session-1");
    expect(schedule.rounds).toHaveLength(3);
    expect(schedule.totalMatchCount).toBe(6);
    expect(schedule.createdAt).toBeInstanceOf(Date);
  });

  test("restoreRoundRobinSchedule はすべてのフィールドを復元する", () => {
    const createdAt = new Date("2024-06-01T00:00:00Z");
    const rounds = [
      {
        roundNumber: 1,
        pairings: [{ player1Id: userId("u1"), player2Id: userId("u2") }],
      },
    ];

    const schedule = restoreRoundRobinSchedule({
      id: roundRobinScheduleId("schedule-1"),
      circleSessionId: circleSessionId("session-1"),
      rounds,
      totalMatchCount: 1,
      createdAt,
    });

    expect(schedule.id).toBe("schedule-1");
    expect(schedule.rounds).toEqual(rounds);
    expect(schedule.totalMatchCount).toBe(1);
    expect(schedule.createdAt).toBe(createdAt);
  });

  test("restoreRoundRobinSchedule は不正な createdAt を拒否する", () => {
    expect(() =>
      restoreRoundRobinSchedule({
        id: roundRobinScheduleId("schedule-1"),
        circleSessionId: circleSessionId("session-1"),
        rounds: [],
        totalMatchCount: 0,
        createdAt: new Date("invalid"),
      }),
    ).toThrow("createdAt must be a valid date");
  });
});
