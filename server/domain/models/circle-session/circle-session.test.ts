import { describe, expect, test } from "vitest";
import { circleId, circleSessionId } from "@/server/domain/common/ids";
import {
  createCircleSession,
  rescheduleCircleSession,
} from "@/server/domain/models/circle-session/circle-session";

describe("CircleSession ドメイン", () => {
  test("createCircleSession は日時と回次を検証する", () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
      location: "A",
    });

    expect(session.sequence).toBe(1);
    expect(session.location).toBe("A");
    expect(session.title).toBe("第1回 研究会");
  });

  test("createCircleSession は title 未指定時に自動生成する", () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 5,
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
    });

    expect(session.title).toBe("第5回 研究会");
  });

  test("createCircleSession は回次が正の整数でない場合に拒否する", () => {
    expect(() =>
      createCircleSession({
        id: circleSessionId("session-1"),
        circleId: circleId("circle-1"),
        sequence: 0,
        title: "第1回 研究会",
        startsAt: new Date("2024-01-01T10:00:00Z"),
        endsAt: new Date("2024-01-01T12:00:00Z"),
      }),
    ).toThrow("sequence must be a positive integer");
  });

  test("createCircleSession は不正な日時を拒否する", () => {
    expect(() =>
      createCircleSession({
        id: circleSessionId("session-1"),
        circleId: circleId("circle-1"),
        sequence: 1,
        title: "第1回 研究会",
        startsAt: new Date("invalid"),
        endsAt: new Date("2024-01-01T12:00:00Z"),
      }),
    ).toThrow("startsAt must be a valid date");
  });

  test("createCircleSession は開始が終了より後なら拒否する", () => {
    expect(() =>
      createCircleSession({
        id: circleSessionId("session-1"),
        circleId: circleId("circle-1"),
        sequence: 1,
        title: "第1回 研究会",
        startsAt: new Date("2024-01-01T13:00:00Z"),
        endsAt: new Date("2024-01-01T12:00:00Z"),
      }),
    ).toThrow("CircleSession start must be before or equal to end");
  });

  test("rescheduleCircleSession は日時を検証する", () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
    });

    const rescheduled = rescheduleCircleSession(
      session,
      new Date("2024-01-02T10:00:00Z"),
      new Date("2024-01-02T12:00:00Z"),
    );

    expect(rescheduled.startsAt.toISOString()).toBe("2024-01-02T10:00:00.000Z");
  });

  test("rescheduleCircleSession は不正な日時を拒否する", () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
    });

    expect(() =>
      rescheduleCircleSession(
        session,
        new Date("invalid"),
        new Date("2024-01-02T12:00:00Z"),
      ),
    ).toThrow("startsAt must be a valid date");
  });

  test("rescheduleCircleSession は開始が終了より後なら拒否する", () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      title: "第1回 研究会",
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
    });

    expect(() =>
      rescheduleCircleSession(
        session,
        new Date("2024-01-02T13:00:00Z"),
        new Date("2024-01-02T12:00:00Z"),
      ),
    ).toThrow("CircleSession start must be before or equal to end");
  });

  test("createCircleSession は note 未指定時に空文字を設定する", () => {
    const session = createCircleSession({
      id: circleSessionId("session-1"),
      circleId: circleId("circle-1"),
      sequence: 1,
      startsAt: new Date("2024-01-01T10:00:00Z"),
      endsAt: new Date("2024-01-01T12:00:00Z"),
    });

    expect(session.note).toBe("");
  });
});
