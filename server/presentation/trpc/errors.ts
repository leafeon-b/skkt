import { TRPCError, type TRPC_ERROR_CODE_KEY } from "@trpc/server";
import {
  type DomainErrorCode,
  DomainError,
  TooManyRequestsError,
} from "@/server/domain/common/errors";

const DOMAIN_TO_TRPC_CODE = {
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  UNAUTHORIZED: "UNAUTHORIZED",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
} as const satisfies Record<DomainErrorCode, TRPC_ERROR_CODE_KEY>;

export const toTrpcError = (error: unknown): TRPCError => {
  if (error instanceof TRPCError) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error("TRPCError with INTERNAL_SERVER_ERROR:", error);
      return new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
    return error;
  }

  // SECURITY: DomainError messages are sent to the client verbatim.
  // Ensure all DomainError subclasses use static, client-safe messages only.
  // Do not include dynamic data (IDs, emails, SQL, etc.) in DomainError messages.
  if (error instanceof DomainError) {
    return new TRPCError({
      code: DOMAIN_TO_TRPC_CODE[error.code],
      message: error.message,
      cause:
        error instanceof TooManyRequestsError
          ? { retryAfterMs: error.retryAfterMs }
          : undefined,
    });
  }

  console.error("Unhandled error in tRPC handler:", error);
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
};

export const handleTrpcError = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw toTrpcError(error);
  }
};
