import { describe, it, expect } from "vitest";
import {
  userId,
  circleId,
  circleSessionId,
  matchId,
  matchHistoryId,
  circleInviteLinkId,
  inviteLinkToken,
} from "./ids";
import { BadRequestError } from "./errors";

describe("userId", () => {
  it("should return branded UserId for valid string", () => {
    const id = userId("user-123");
    expect(id).toBe("user-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => userId("")).toThrow(BadRequestError);
    expect(() => userId("")).toThrow("Invalid user ID");
  });
});

describe("circleId", () => {
  it("should return branded CircleId for valid string", () => {
    const id = circleId("circle-123");
    expect(id).toBe("circle-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => circleId("")).toThrow(BadRequestError);
    expect(() => circleId("")).toThrow("Invalid circle ID");
  });
});

describe("circleSessionId", () => {
  it("should return branded CircleSessionId for valid string", () => {
    const id = circleSessionId("session-123");
    expect(id).toBe("session-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => circleSessionId("")).toThrow(BadRequestError);
    expect(() => circleSessionId("")).toThrow("Invalid circle session ID");
  });
});

describe("matchId", () => {
  it("should return branded MatchId for valid string", () => {
    const id = matchId("match-123");
    expect(id).toBe("match-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => matchId("")).toThrow(BadRequestError);
    expect(() => matchId("")).toThrow("Invalid match ID");
  });
});

describe("matchHistoryId", () => {
  it("should return branded MatchHistoryId for valid string", () => {
    const id = matchHistoryId("history-123");
    expect(id).toBe("history-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => matchHistoryId("")).toThrow(BadRequestError);
    expect(() => matchHistoryId("")).toThrow("Invalid match history ID");
  });
});

describe("circleInviteLinkId", () => {
  it("should return branded CircleInviteLinkId for valid string", () => {
    const id = circleInviteLinkId("invite-123");
    expect(id).toBe("invite-123");
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => circleInviteLinkId("")).toThrow(BadRequestError);
    expect(() => circleInviteLinkId("")).toThrow(
      "Invalid circle invite link ID",
    );
  });
});

describe("inviteLinkToken", () => {
  it("should return branded InviteLinkToken for valid UUID string", () => {
    const token = inviteLinkToken("550e8400-e29b-41d4-a716-446655440000");
    expect(token).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("should throw BadRequestError for non-UUID string", () => {
    expect(() => inviteLinkToken("not-a-uuid")).toThrow(BadRequestError);
    expect(() => inviteLinkToken("not-a-uuid")).toThrow(
      "Invalid invite link token",
    );
  });

  it("should throw BadRequestError for empty string", () => {
    expect(() => inviteLinkToken("")).toThrow(BadRequestError);
    expect(() => inviteLinkToken("")).toThrow("Invalid invite link token");
  });

  it("should accept uppercase hex UUID", () => {
    const token = inviteLinkToken("550E8400-E29B-41D4-A716-446655440000");
    expect(token).toBe("550E8400-E29B-41D4-A716-446655440000");
  });

  it("should throw BadRequestError for UUID-like string with wrong length", () => {
    expect(() => inviteLinkToken("550e8400-e29b-41d4-a716-44665544000")).toThrow(
      BadRequestError,
    );
  });
});
