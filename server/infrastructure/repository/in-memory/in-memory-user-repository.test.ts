import { describe, expect, test } from "vitest";
import { createInMemoryUserRepository } from "./in-memory-user-repository";
import { createUser } from "@/server/domain/models/user/user";
import { userId } from "@/server/domain/common/ids";
import { ConflictError } from "@/server/domain/common/errors";

describe("InMemoryUserRepository", () => {
  const makeRepo = () => createInMemoryUserRepository();

  describe("User CRUD", () => {
    test("save した User を findById で取得できる", async () => {
      const repo = makeRepo();
      const user = createUser({ id: userId("u1"), name: "Alice" });
      await repo.save(user);

      const found = await repo.findById(userId("u1"));
      expect(found).toEqual(user);
    });

    test("存在しない User は null を返す", async () => {
      const repo = makeRepo();
      const found = await repo.findById(userId("not-exist"));
      expect(found).toBeNull();
    });

    test("findByEmail でメールアドレスから取得できる", async () => {
      const repo = makeRepo();
      const user = createUser({
        id: userId("u1"),
        name: "Alice",
        email: "alice@example.com",
      });
      await repo.save(user);

      const found = await repo.findByEmail("alice@example.com");
      expect(found?.id).toBe(userId("u1"));
    });

    test("findByIds は入力順を保持する", async () => {
      const repo = makeRepo();
      const u1 = createUser({ id: userId("u1"), name: "A" });
      const u2 = createUser({ id: userId("u2"), name: "B" });
      await repo.save(u1);
      await repo.save(u2);

      const result = await repo.findByIds([userId("u2"), userId("u1")]);
      expect(result.map((u) => u.id)).toEqual([userId("u2"), userId("u1")]);
    });

    test("save は既存の User を上書きする（パスワード情報は保持）", async () => {
      const repo = makeRepo();
      await repo.createUser({
        email: "alice@example.com",
        passwordHash: "hash123",
        name: "Alice",
      });
      // createUser で作成された User を取得
      const user = await repo.findByEmail("alice@example.com");
      expect(user).not.toBeNull();

      // save で名前を更新
      await repo.save({ ...user!, name: "Alice Updated" });

      const found = await repo.findById(user!.id);
      expect(found?.name).toBe("Alice Updated");
      // パスワードハッシュは保持される
      const hash = await repo.findPasswordHashById(user!.id);
      expect(hash).toBe("hash123");
    });
  });

  describe("Profile", () => {
    test("updateProfile で名前とメールを更新できる", async () => {
      const repo = makeRepo();
      const user = createUser({
        id: userId("u1"),
        name: "Alice",
        email: "old@example.com",
      });
      await repo.save(user);
      await repo.updateProfile(userId("u1"), "Bob", "new@example.com");

      const found = await repo.findById(userId("u1"));
      expect(found?.name).toBe("Bob");
      expect(found?.email).toBe("new@example.com");
    });

    test("updateProfileVisibility で公開設定を変更できる", async () => {
      const repo = makeRepo();
      const user = createUser({ id: userId("u1") });
      await repo.save(user);

      await repo.updateProfileVisibility(userId("u1"), "PRIVATE");

      const found = await repo.findById(userId("u1"));
      expect(found?.profileVisibility).toBe("PRIVATE");
    });
  });

  describe("Email", () => {
    test("emailExists は存在するメールで true を返す", async () => {
      const repo = makeRepo();
      const user = createUser({
        id: userId("u1"),
        email: "alice@example.com",
      });
      await repo.save(user);

      expect(await repo.emailExists("alice@example.com")).toBe(true);
      expect(await repo.emailExists("bob@example.com")).toBe(false);
    });

    test("emailExists は excludeUserId で指定したユーザーを除外する", async () => {
      const repo = makeRepo();
      const user = createUser({
        id: userId("u1"),
        email: "alice@example.com",
      });
      await repo.save(user);

      expect(
        await repo.emailExists("alice@example.com", userId("u1")),
      ).toBe(false);
      expect(
        await repo.emailExists("alice@example.com", userId("u2")),
      ).toBe(true);
    });
  });

  describe("Password", () => {
    test("createUser 後にパスワードハッシュを取得できる", async () => {
      const repo = makeRepo();
      const id = await repo.createUser({
        email: "alice@example.com",
        passwordHash: "hash123",
        name: "Alice",
      });

      const hash = await repo.findPasswordHashById(id);
      expect(hash).toBe("hash123");
    });

    test("updatePasswordHash でパスワードを更新できる", async () => {
      const repo = makeRepo();
      const id = await repo.createUser({
        email: "alice@example.com",
        passwordHash: "old-hash",
        name: "Alice",
      });
      const changedAt = new Date("2024-06-01");
      await repo.updatePasswordHash(id, "new-hash", changedAt);

      expect(await repo.findPasswordHashById(id)).toBe("new-hash");
      expect(await repo.findPasswordChangedAt(id)).toEqual(changedAt);
    });

    test("存在しない User のパスワードハッシュは null を返す", async () => {
      const repo = makeRepo();
      const hash = await repo.findPasswordHashById(userId("not-exist"));
      expect(hash).toBeNull();
    });
  });

  describe("createUser", () => {
    test("createUser は新しい UserId を返す", async () => {
      const repo = makeRepo();
      const id = await repo.createUser({
        email: "alice@example.com",
        passwordHash: "hash",
        name: "Alice",
      });

      expect(id).toBeTruthy();
      const found = await repo.findById(id);
      expect(found?.email).toBe("alice@example.com");
      expect(found?.name).toBe("Alice");
    });

    test("重複メールで createUser すると ConflictError になる", async () => {
      const repo = makeRepo();
      await repo.createUser({
        email: "alice@example.com",
        passwordHash: "hash",
        name: "Alice",
      });

      await expect(
        repo.createUser({
          email: "alice@example.com",
          passwordHash: "hash2",
          name: "Alice 2",
        }),
      ).rejects.toThrow(ConflictError);
    });
  });
});
