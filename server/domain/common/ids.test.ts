import { describe, it, expect } from "vitest";
import {
  toUserId,
  toCircleId,
  toCircleSessionId,
  toMatchId,
  toCircleInviteLinkId,
  toInviteLinkToken,
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
