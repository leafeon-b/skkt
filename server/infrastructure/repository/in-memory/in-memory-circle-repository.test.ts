import { describe, expect, test } from "vitest";
import { createInMemoryCircleRepository } from "./in-memory-circle-repository";
import { createCircle } from "@/server/domain/models/circle/circle";
import { toCircleId, toUserId } from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";

describe("InMemoryCircleRepository", () => {
  const makeRepo = () => createInMemoryCircleRepository();

  describe("Circle CRUD", () => {
    test("save した Circle を findById で取得できる", async () => {
      const repo = makeRepo();
      const circle = createCircle({ id: toCircleId("c1"), name: "テスト研究会" });
      await repo.save(circle);

      const found = await repo.findById(toCircleId("c1"));
      expect(found).toEqual(circle);
    });

    test("存在しない Circle は null を返す", async () => {
      const repo = makeRepo();
      const found = await repo.findById(toCircleId("not-exist"));
      expect(found).toBeNull();
    });

    test("findByIds は入力順を保持する", async () => {
      const repo = makeRepo();
      const c1 = createCircle({ id: toCircleId("c1"), name: "A" });
      const c2 = createCircle({ id: toCircleId("c2"), name: "B" });
      const c3 = createCircle({ id: toCircleId("c3"), name: "C" });
      await repo.save(c1);
      await repo.save(c2);
      await repo.save(c3);

      const result = await repo.findByIds([
        toCircleId("c3"),
        toCircleId("c1"),
        toCircleId("c2"),
      ]);
      expect(result.map((c) => c.id)).toEqual([
        toCircleId("c3"),
        toCircleId("c1"),
        toCircleId("c2"),
      ]);
    });

    test("findByIds は存在しない ID をスキップする", async () => {
      const repo = makeRepo();
      const c1 = createCircle({ id: toCircleId("c1"), name: "A" });
      await repo.save(c1);

      const result = await repo.findByIds([
        toCircleId("c1"),
        toCircleId("not-exist"),
      ]);
      expect(result).toHaveLength(1);
    });

    test("findByIds に空配列を渡すと空配列を返す", async () => {
      const repo = makeRepo();
      const result = await repo.findByIds([]);
      expect(result).toEqual([]);
    });

    test("save は既存の Circle を上書きする", async () => {
      const repo = makeRepo();
      const circle = createCircle({ id: toCircleId("c1"), name: "Before" });
      await repo.save(circle);
      await repo.save({ ...circle, name: "After" });

      const found = await repo.findById(toCircleId("c1"));
      expect(found?.name).toBe("After");
    });

    test("delete は Circle を削除する", async () => {
      const repo = makeRepo();
      const circle = createCircle({ id: toCircleId("c1"), name: "テスト" });
      await repo.save(circle);
      await repo.delete(toCircleId("c1"));

      const found = await repo.findById(toCircleId("c1"));
      expect(found).toBeNull();
    });
  });

  describe("Membership", () => {
    test("addMembership で追加したメンバーを listMembershipsByCircleId で取得できる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleOwner,
      );

      const memberships = await repo.listMembershipsByCircleId(toCircleId("c1"));
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe(toUserId("u1"));
      expect(memberships[0].role).toBe(CircleRole.CircleOwner);
    });

    test("同一ユーザーの重複追加は ConflictError になる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleMember,
      );

      await expect(
        repo.addMembership(
          toCircleId("c1"),
          toUserId("u1"),
          CircleRole.CircleMember,
        ),
      ).rejects.toThrow(ConflictError);
    });

    test("論理削除済みユーザーを再追加できる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleMember,
      );
      await repo.removeMembership(toCircleId("c1"), toUserId("u1"), new Date());

      // 再追加は成功するべき（部分ユニークインデックスの振る舞い）
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleOwner,
      );

      const memberships = await repo.listMembershipsByCircleId(toCircleId("c1"));
      expect(memberships).toHaveLength(1);
      expect(memberships[0].role).toBe(CircleRole.CircleOwner);
    });

    test("updateMembershipRole でロールを変更できる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleMember,
      );
      await repo.updateMembershipRole(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleManager,
      );

      const memberships = await repo.listMembershipsByCircleId(toCircleId("c1"));
      expect(memberships[0].role).toBe(CircleRole.CircleManager);
    });

    test("存在しないメンバーのロール変更は NotFoundError になる", async () => {
      const repo = makeRepo();
      await expect(
        repo.updateMembershipRole(
          toCircleId("c1"),
          toUserId("u1"),
          CircleRole.CircleManager,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    test("removeMembership で論理削除される", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleMember,
      );
      const deletedAt = new Date();
      await repo.removeMembership(toCircleId("c1"), toUserId("u1"), deletedAt);

      const memberships = await repo.listMembershipsByCircleId(toCircleId("c1"));
      expect(memberships).toHaveLength(0);
    });

    test("論理削除済みメンバーのロール変更は NotFoundError になる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleMember,
      );
      await repo.removeMembership(toCircleId("c1"), toUserId("u1"), new Date());

      await expect(
        repo.updateMembershipRole(
          toCircleId("c1"),
          toUserId("u1"),
          CircleRole.CircleManager,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    test("listMembershipsByUserId はユーザーの全メンバーシップを createdAt desc で返す", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleMember,
      );
      // 少し時間をずらすため直接ストアに追加
      const memberships = repo._membershipStore.get(toCircleId("c1"))!;
      memberships[0] = {
        ...memberships[0],
        createdAt: new Date("2024-01-01"),
      };
      repo._membershipStore.set(toCircleId("c1"), memberships);

      await repo.addMembership(
        toCircleId("c2"),
        toUserId("u1"),
        CircleRole.CircleOwner,
      );

      const result = await repo.listMembershipsByUserId(toUserId("u1"));
      expect(result).toHaveLength(2);
      // c2 の方が新しいので先に来る
      expect(result[0].circleId).toBe(toCircleId("c2"));
      expect(result[1].circleId).toBe(toCircleId("c1"));
    });

    test("存在しないメンバーの removeMembership は NotFoundError になる", async () => {
      const repo = makeRepo();
      await expect(
        repo.removeMembership(toCircleId("c1"), toUserId("u1"), new Date()),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
