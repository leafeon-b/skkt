import { TRPCError } from "@trpc/server";

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

export const toTrpcError = (error: unknown): TRPCError => {
  if (error instanceof TRPCError) {
    return error;
  }

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
