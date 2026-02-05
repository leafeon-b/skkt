import { describe, it, expect } from "vitest";
import {
  DomainError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
} from "./errors";

describe("DomainError", () => {
  it("should have correct message and code", () => {
    const error = new DomainError("test message", "NOT_FOUND");
    expect(error.message).toBe("test message");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("DomainError");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("should format message with entity name", () => {
    const error = new NotFoundError("Circle");
    expect(error.message).toBe("Circle not found");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("NotFoundError");
  });

  it("should be instance of DomainError", () => {
    const error = new NotFoundError("User");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("ForbiddenError", () => {
  it("should use default message", () => {
    const error = new ForbiddenError();
    expect(error.message).toBe("Forbidden");
    expect(error.code).toBe("FORBIDDEN");
    expect(error.name).toBe("ForbiddenError");
  });

  it("should accept custom message", () => {
    const error = new ForbiddenError("Custom forbidden message");
    expect(error.message).toBe("Custom forbidden message");
    expect(error.code).toBe("FORBIDDEN");
  });

  it("should be instance of DomainError", () => {
    const error = new ForbiddenError();
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("UnauthorizedError", () => {
  it("should use default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.name).toBe("UnauthorizedError");
  });

  it("should accept custom message", () => {
    const error = new UnauthorizedError("Custom unauthorized message");
    expect(error.message).toBe("Custom unauthorized message");
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("should be instance of DomainError", () => {
    const error = new UnauthorizedError();
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("BadRequestError", () => {
  it("should have custom message", () => {
    const error = new BadRequestError("Invalid input");
    expect(error.message).toBe("Invalid input");
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.name).toBe("BadRequestError");
  });

  it("should be instance of DomainError", () => {
    const error = new BadRequestError("Test");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});
