import { beforeEach, describe, expect, test, vi } from "vitest";
import { type UserId } from "@/server/domain/common/ids";
import { UnauthorizedError } from "@/server/domain/common/errors";

vi.mock("@/server/env", () => ({
  env: { NEXTAUTH_URL: "http://localhost:3000" },
}));

import {
  createMockDeps,
  toServiceContainerDeps,
} from "@/server/presentation/providers/__tests__/helpers/create-mock-deps";
import { createServiceContainer } from "@/server/infrastructure/service-container";

const mockDeps = createMockDeps();

const { mockGetSessionUserId } = vi.hoisted(() => ({
  mockGetSessionUserId: vi.fn(),
}));

vi.mock("@/server/presentation/trpc/context", () => ({
  buildServiceContainer: () => {
    return createServiceContainer(toServiceContainerDeps(mockDeps));
  },
  getSessionUserId: mockGetSessionUserId,
}));

const { POST } = await import("./route");

const actorId = "user-1" as UserId;

const createFormDataRequest = (
  file?: File,
  options?: { origin?: string | null },
) => {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  const headers: Record<string, string> = {};
  const origin = options?.origin === undefined ? "http://localhost:3000" : options.origin;
  if (origin !== null) {
    headers["Origin"] = origin;
  }
  return new Request("http://localhost/api/upload/avatar", {
    method: "POST",
    body: formData,
    headers,
  });
};

describe("POST /api/upload/avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionUserId.mockResolvedValue(actorId);
    mockDeps.userRepository.findById.mockResolvedValue({
      id: actorId,
      name: "Taro",
      email: "taro@example.com",
      image: null,
      hasCustomImage: false,
      profileVisibility: "PUBLIC",
      createdAt: new Date(),
    });
  });

  test("アップロード成功時に200とsuccess:trueが返る", async () => {
    // PNG magic bytes
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]);
    const file = new File([pngData], "avatar.png", {
      type: "image/png",
    });
    const res = await POST(createFormDataRequest(file));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  test("未認証時に401が返る", async () => {
    mockGetSessionUserId.mockRejectedValue(new UnauthorizedError());

    const file = new File(["fake-image"], "avatar.png", {
      type: "image/png",
    });
    const res = await POST(createFormDataRequest(file));

    expect(res.status).toBe(401);
  });

  test("ファイルが含まれないリクエストで400が返る", async () => {
    const res = await POST(createFormDataRequest());

    expect(res.status).toBe(400);
  });

  test("不正なMIMEタイプ時に400が返る", async () => {
    const file = new File(["not-an-image"], "file.txt", {
      type: "text/plain",
    });
    const res = await POST(createFormDataRequest(file));

    expect(res.status).toBe(400);
  });

  test("0バイトファイル時に400が返る", async () => {
    const file = new File([], "empty.png", {
      type: "image/png",
    });
    const res = await POST(createFormDataRequest(file));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "ファイルが空です",
    });
  });

  test("ファイルサイズ超過時に400が返る", async () => {
    const largeContent = new Uint8Array(2 * 1024 * 1024 + 1);
    const file = new File([largeContent], "large.png", {
      type: "image/png",
    });
    const res = await POST(createFormDataRequest(file));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "ファイルサイズが大きすぎます",
    });
  });

  test("Originヘッダーが不正なオリジンの場合に403が返る", async () => {
    const file = new File(["fake"], "avatar.png", { type: "image/png" });
    const res = await POST(
      createFormDataRequest(file, { origin: "https://evil.example.com" }),
    );

    expect(res.status).toBe(403);
  });

  test("Originヘッダーが未設定の場合に403が返る", async () => {
    const file = new File(["fake"], "avatar.png", { type: "image/png" });
    const res = await POST(createFormDataRequest(file, { origin: null }));

    expect(res.status).toBe(403);
  });

  test("正当なOriginヘッダーの場合は処理が継続される", async () => {
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]);
    const file = new File([pngData], "avatar.png", { type: "image/png" });
    const res = await POST(
      createFormDataRequest(file, { origin: "http://localhost:3000" }),
    );

    expect(res.status).toBe(200);
  });
});
