import { beforeEach, describe, expect, test, vi } from "vitest";
import { type UserId } from "@/server/domain/common/ids";
import {
  createMockDeps,
  createServiceContainer,
  toServiceContainerDeps,
} from "@/server/presentation/providers/__tests__/helpers/create-mock-deps";

const mockDeps = createMockDeps();

vi.mock("@/server/presentation/trpc/context", () => ({
  buildServiceContainer: () => {
    return createServiceContainer(toServiceContainerDeps(mockDeps));
  },
}));

const { POST } = await import("./route");

const validBody = {
  email: "test@example.com",
  password: "password123",
  name: "Test User",
  agreedToTerms: true,
};

const postJson = (body: unknown) =>
  POST(
    new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock implementations cleared by clearAllMocks
    mockDeps.userRepository.emailExists.mockResolvedValue(false);
    mockDeps.userRepository.createUser.mockResolvedValue(
      "new-user-id" as UserId,
    );
    mockDeps.passwordHasher.hash.mockReturnValue("hashed");
  });

  test("有効な入力でユーザーが作成される（201）", async () => {
    const res = await postJson(validBody);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "new-user-id" });
  });

  test("不正なJSONで400が返る", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  test("利用規約未同意で400が返る", async () => {
    const res = await postJson({ ...validBody, agreedToTerms: false });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("利用規約");
  });

  test("不正なメールアドレスで400が返る", async () => {
    const res = await postJson({ ...validBody, email: "invalid" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("メールアドレス");
  });

  test("パスワードが短すぎて400が返る", async () => {
    const res = await postJson({ ...validBody, password: "short" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("パスワード");
  });

  test("既存メールで409が返る", async () => {
    mockDeps.userRepository.emailExists.mockResolvedValue(true);
    const res = await postJson(validBody);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toContain("既に登録");
  });
});
