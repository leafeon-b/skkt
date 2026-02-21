/**
 * カスタムError型
 *
 * ドメイン層で発生するエラーを型安全に扱うための基底クラスと具象クラス。
 * Presentation層でTRPCエラーへ変換される。
 */

export type DomainErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS";

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: DomainErrorCode,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string) {
    super(`${entity} not found`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(message, "BAD_REQUEST");
    this.name = "BadRequestError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends DomainError {
  constructor(message = "Too many requests") {
    super(message, "TOO_MANY_REQUESTS");
    this.name = "TooManyRequestsError";
  }
}
