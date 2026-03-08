import { describe, it, expect } from "vitest";
import {
  toUserId,
  toCircleId,
  toCircleSessionId,
  toMatchId,
  toCircleInviteLinkId,
  toInviteLinkToken,
  toRoundRobinScheduleId,
} from "./ids";
import { BadRequestError } from "./errors";

describe("toUserId", () => {
  it("should return branded UserId for valid string", () => {
    const id = toUserId("user-123");
    expect(id).toBe("user-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => toUserId("")).toThrow(BadRequestError);
    expect(() => toUserId("")).toThrow("Invalid user ID");
  });

  it("空白のみの文字列はBadRequestErrorをスローする", () => {
    expect(() => toUserId("   ")).toThrow(BadRequestError);
    expect(() => toUserId("\t")).toThrow(BadRequestError);
    expect(() => toUserId("\n")).toThrow(BadRequestError);
  });
});

describe("toCircleId", () => {
  it("should return branded CircleId for valid string", () => {
    const id = toCircleId("circle-123");
    expect(id).toBe("circle-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => toCircleId("")).toThrow(BadRequestError);
    expect(() => toCircleId("")).toThrow("Invalid circle ID");
  });

  it("空白のみの文字列はBadRequestErrorをスローする", () => {
    expect(() => toCircleId("   ")).toThrow(BadRequestError);
    expect(() => toCircleId("\t")).toThrow(BadRequestError);
    expect(() => toCircleId("\n")).toThrow(BadRequestError);
  });
});

describe("toCircleSessionId", () => {
  it("should return branded CircleSessionId for valid string", () => {
    const id = toCircleSessionId("session-123");
    expect(id).toBe("session-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => toCircleSessionId("")).toThrow(BadRequestError);
    expect(() => toCircleSessionId("")).toThrow("Invalid circle session ID");
  });

  it("空白のみの文字列はBadRequestErrorをスローする", () => {
    expect(() => toCircleSessionId("   ")).toThrow(BadRequestError);
    expect(() => toCircleSessionId("\t")).toThrow(BadRequestError);
    expect(() => toCircleSessionId("\n")).toThrow(BadRequestError);
  });
});

describe("toMatchId", () => {
  it("should return branded MatchId for valid string", () => {
    const id = toMatchId("match-123");
    expect(id).toBe("match-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => toMatchId("")).toThrow(BadRequestError);
    expect(() => toMatchId("")).toThrow("Invalid match ID");
  });

  it("空白のみの文字列はBadRequestErrorをスローする", () => {
    expect(() => toMatchId("   ")).toThrow(BadRequestError);
    expect(() => toMatchId("\t")).toThrow(BadRequestError);
    expect(() => toMatchId("\n")).toThrow(BadRequestError);
  });
});

describe("toCircleInviteLinkId", () => {
  it("should return branded CircleInviteLinkId for valid string", () => {
    const id = toCircleInviteLinkId("invite-123");
    expect(id).toBe("invite-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => toCircleInviteLinkId("")).toThrow(BadRequestError);
    expect(() => toCircleInviteLinkId("")).toThrow(
      "Invalid circle invite link ID",
    );
  });

  it("空白のみの文字列はBadRequestErrorをスローする", () => {
    expect(() => toCircleInviteLinkId("   ")).toThrow(BadRequestError);
    expect(() => toCircleInviteLinkId("\t")).toThrow(BadRequestError);
    expect(() => toCircleInviteLinkId("\n")).toThrow(BadRequestError);
  });
});

describe("toRoundRobinScheduleId", () => {
  it("should return branded RoundRobinScheduleId for valid string", () => {
    const id = toRoundRobinScheduleId("schedule-123");
    expect(id).toBe("schedule-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => toRoundRobinScheduleId("")).toThrow(BadRequestError);
    expect(() => toRoundRobinScheduleId("")).toThrow(
      "Invalid round robin schedule ID",
    );
  });

  it("空白のみの文字列はBadRequestErrorをスローする", () => {
    expect(() => toRoundRobinScheduleId("   ")).toThrow(BadRequestError);
    expect(() => toRoundRobinScheduleId("\t")).toThrow(BadRequestError);
    expect(() => toRoundRobinScheduleId("\n")).toThrow(BadRequestError);
  });
});

describe("toInviteLinkToken", () => {
  it("should return branded InviteLinkToken for valid UUID string", () => {
    const token = toInviteLinkToken("550e8400-e29b-41d4-a716-446655440000");
    expect(token).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("should throw BadRequestError for non-UUID string", () => {
    expect(() => toInviteLinkToken("not-a-uuid")).toThrow(BadRequestError);
    expect(() => toInviteLinkToken("not-a-uuid")).toThrow(
      "Invalid invite link token",
    );
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => toInviteLinkToken("")).toThrow(BadRequestError);
    expect(() => toInviteLinkToken("")).toThrow("Invalid invite link token");
  });

  it("should accept uppercase hex UUID", () => {
    const token = toInviteLinkToken("550E8400-E29B-41D4-A716-446655440000");
    expect(token).toBe("550E8400-E29B-41D4-A716-446655440000");
  });

  it("should throw BadRequestError for UUID-like string with wrong length", () => {
    expect(() =>
      toInviteLinkToken("550e8400-e29b-41d4-a716-44665544000"),
    ).toThrow(BadRequestError);
  });
});
