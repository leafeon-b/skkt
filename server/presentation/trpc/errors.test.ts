import { describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { toTrpcError, handleTrpcError } from "./errors";
import {
  DomainError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
} from "@/server/domain/common/errors";

describe("toTrpcError", () => {
  test("TRPCError はそのままパススルーされる", () => {
    const original = new TRPCError({
      code: "BAD_REQUEST",
      message: "invalid input",
    });
    const result = toTrpcError(original);
    expect(result).toBe(original);
  });

  describe("DomainError は対応する TRPC エラーに変換される", () => {
    test("NotFoundError -> NOT_FOUND", () => {
      const result = toTrpcError(new NotFoundError("Circle"));
      expect(result).toBeInstanceOf(TRPCError);
      expect(result.code).toBe("NOT_FOUND");
      expect(result.message).toBe("Circle not found");
    });

    test("ForbiddenError -> FORBIDDEN", () => {
      const result = toTrpcError(new ForbiddenError());
      expect(result).toBeInstanceOf(TRPCError);
      expect(result.code).toBe("FORBIDDEN");
      expect(result.message).toBe("Forbidden");
    });

    test("UnauthorizedError -> UNAUTHORIZED", () => {
      const result = toTrpcError(new UnauthorizedError());
      expect(result).toBeInstanceOf(TRPCError);
      expect(result.code).toBe("UNAUTHORIZED");
      expect(result.message).toBe("Unauthorized");
    });

    test("BadRequestError -> BAD_REQUEST", () => {
      const result = toTrpcError(new BadRequestError("invalid"));
      expect(result).toBeInstanceOf(TRPCError);
      expect(result.code).toBe("BAD_REQUEST");
      expect(result.message).toBe("invalid");
    });
  });

  describe("フォールバック文字列マッチ", () => {
    test('"Unauthorized" -> UNAUTHORIZED', () => {
      const result = toTrpcError(new Error("Unauthorized"));
      expect(result.code).toBe("UNAUTHORIZED");
    });

    test('"Forbidden" -> FORBIDDEN', () => {
      const result = toTrpcError(new Error("Forbidden"));
      expect(result.code).toBe("FORBIDDEN");
    });

    test('"xxx not found" -> NOT_FOUND（生メッセージは漏洩しない）', () => {
      const result = toTrpcError(new Error("User cid_secret not found"));
      expect(result.code).toBe("NOT_FOUND");
      expect(result.message).toBe("Resource not found");
      expect(result.message).not.toContain("cid_secret");
    });
  });

  describe("未分類エラーのフォールバック", () => {
    test("生メッセージが漏洩せず INTERNAL_SERVER_ERROR が返る", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const original = new Error("DB connection failed: host=secret-db");
      const result = toTrpcError(original);

      expect(result.code).toBe("INTERNAL_SERVER_ERROR");
      expect(result.message).toBe("Internal server error");
      expect(result.message).not.toContain("secret-db");

      expect(spy).toHaveBeenCalledWith(
        "Unhandled error in tRPC handler:",
        original,
      );
      spy.mockRestore();
    });

    test("非 Error オブジェクトでも INTERNAL_SERVER_ERROR が返る", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = toTrpcError("string error");

      expect(result.code).toBe("INTERNAL_SERVER_ERROR");
      expect(result.message).toBe("Internal server error");

      spy.mockRestore();
    });
  });
});

describe("handleTrpcError", () => {
  test("成功時はそのまま値を返す", async () => {
    const result = await handleTrpcError(async () => "ok");
    expect(result).toBe("ok");
  });

  test("失敗時は toTrpcError で変換された TRPCError を投げる", async () => {
    await expect(
      handleTrpcError(async () => {
        throw new NotFoundError("Circle");
      }),
    ).rejects.toThrow(TRPCError);
  });

  test("未分類エラーでも生メッセージは漏洩しない", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      handleTrpcError(async () => {
        throw new Error("secret credentials");
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
    spy.mockRestore();
  });
});
