import { beforeEach, describe, expect, test, vi } from "vitest";
import { type UserId } from "@/server/domain/common/ids";

vi.mock("@/server/env", () => ({ env: {} }));

import {
  createMockDeps,
  createServiceContainer,
  toServiceContainerDeps,
} from "@/server/test-utils/create-mock-deps";

const mockDeps = createMockDeps();

vi.mock("@/server/presentation/trpc/context", () => ({
  buildServiceContainer: () => {
    return createServiceContainer(toServiceContainerDeps(mockDeps));
  },
}));

const { GET } = await import("./route");

const userId = "user-1" as UserId;

const createGetRequest = () =>
  new Request(`http://localhost/api/avatar/${userId}`);

const callGET = (id: string = userId) =>
  GET(createGetRequest(), { params: Promise.resolve({ userId: id }) });

describe("GET /api/avatar/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("画像データが存在する場合に正しいContent-Typeとバイナリデータが返る（200）", async () => {
    const imageBuffer = Buffer.from("fake-png-data");
    mockDeps.userRepository.findImageData.mockResolvedValue({
      data: imageBuffer,
      mimeType: "image/png",
    });

    const res = await callGET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");

    const body = await res.arrayBuffer();
    expect(Buffer.from(body)).toEqual(imageBuffer);
  });

  test("レスポンスヘッダーにセキュリティヘッダーが含まれる", async () => {
    mockDeps.userRepository.findImageData.mockResolvedValue({
      data: Buffer.from("fake-data"),
      mimeType: "image/jpeg",
    });

    const res = await callGET();

    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Security-Policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'",
    );
  });

  test("画像データが存在しない場合に404が返る", async () => {
    mockDeps.userRepository.findImageData.mockResolvedValue(null);

    const res = await callGET();

    expect(res.status).toBe(404);
  });
});
