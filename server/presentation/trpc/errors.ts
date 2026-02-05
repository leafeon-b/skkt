import { TRPCError } from "@trpc/server";
import { DomainError } from "@/server/domain/common/errors";

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

export const toTrpcError = (error: unknown): TRPCError => {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof DomainError) {
    return new TRPCError({ code: error.code, message: error.message });
  }

  // フォールバック（移行期間中の互換性維持）
  const message = toMessage(error);

  if (message === "Unauthorized") {
    return new TRPCError({ code: "UNAUTHORIZED", message });
  }

  if (message === "Forbidden") {
    return new TRPCError({ code: "FORBIDDEN", message });
  }

  if (message.endsWith("not found")) {
    return new TRPCError({ code: "NOT_FOUND", message });
  }

  return new TRPCError({ code: "BAD_REQUEST", message });
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
