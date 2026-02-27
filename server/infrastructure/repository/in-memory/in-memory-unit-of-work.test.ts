import { describe, expect, test } from "vitest";
import { createInMemoryUnitOfWork } from "./in-memory-unit-of-work";
import { createInMemoryRepositories } from "./index";

describe("InMemoryUnitOfWork", () => {
  test("operation にリポジトリを渡して結果を返す", async () => {
    const { repos } = createInMemoryRepositories();
    const unitOfWork = createInMemoryUnitOfWork(repos);

    const result = await unitOfWork(async (r) => {
      expect(r).toBe(repos);
      return 42;
    });

    expect(result).toBe(42);
  });

  test("operation が例外を投げた場合はそのまま伝播する", async () => {
    const { repos } = createInMemoryRepositories();
    const unitOfWork = createInMemoryUnitOfWork(repos);

    await expect(
      unitOfWork(async () => {
        throw new Error("test error");
      }),
    ).rejects.toThrow("test error");
  });
});
