import { TRPCError } from "@trpc/server";
import { DomainError } from "@/server/domain/common/errors";

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
    return new TRPCError({ code: error.code, message: error.message });
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
