import { describe, expect, test } from "vitest";
import { createInMemoryCircleSessionRepository } from "./in-memory-circle-session-repository";
import { createCircleSession } from "@/server/domain/models/circle-session/circle-session";
import { circleId, circleSessionId, userId } from "@/server/domain/common/ids";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";
import { ConflictError, NotFoundError } from "@/server/domain/common/errors";

describe("InMemoryCircleSessionRepository", () => {
  const makeRepo = () => createInMemoryCircleSessionRepository();

  const makeSession = (
    id: string,
    cId: string,
    startsAt: Date,
    createdAt?: Date,
  ) =>
    createCircleSession({
      id: circleSessionId(id),
      circleId: circleId(cId),
      title: `Session ${id}`,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 3600000),
      createdAt,
    });

  describe("CircleSession CRUD", () => {
    test("save した Session を findById で取得できる", async () => {
      const repo = makeRepo();
      const session = makeSession("s1", "c1", new Date("2024-06-01T10:00:00Z"));
      await repo.save(session);

      const found = await repo.findById(circleSessionId("s1"));
      expect(found).toEqual(session);
    });

    test("存在しない Session は null を返す", async () => {
      const repo = makeRepo();
      const found = await repo.findById(circleSessionId("not-exist"));
      expect(found).toBeNull();
    });

    test("findByIds は入力順を保持する", async () => {
      const repo = makeRepo();
      const s1 = makeSession("s1", "c1", new Date("2024-06-01T10:00:00Z"));
      const s2 = makeSession("s2", "c1", new Date("2024-06-02T10:00:00Z"));
      await repo.save(s1);
      await repo.save(s2);

      const result = await repo.findByIds([
        circleSessionId("s2"),
        circleSessionId("s1"),
      ]);
      expect(result.map((s) => s.id)).toEqual([
        circleSessionId("s2"),
        circleSessionId("s1"),
      ]);
    });

    test("listByCircleId は startsAt → createdAt の昇順で返す", async () => {
      const repo = makeRepo();
      const sameStart = new Date("2024-06-01T10:00:00Z");
      const s1 = makeSession("s1", "c1", sameStart, new Date("2024-01-02"));
      const s2 = makeSession("s2", "c1", sameStart, new Date("2024-01-01"));
      const s3 = makeSession(
        "s3",
        "c1",
        new Date("2024-05-01T10:00:00Z"),
        new Date("2024-01-03"),
      );
      await repo.save(s1);
      await repo.save(s2);
      await repo.save(s3);

      const result = await repo.listByCircleId(circleId("c1"));
      expect(result.map((s) => s.id)).toEqual([
        circleSessionId("s3"), // startsAt が最も早い
        circleSessionId("s2"), // 同じ startsAt → createdAt が早い
        circleSessionId("s1"),
      ]);
    });

    test("delete は Session を削除する", async () => {
      const repo = makeRepo();
      const session = makeSession("s1", "c1", new Date("2024-06-01T10:00:00Z"));
      await repo.save(session);
      await repo.delete(circleSessionId("s1"));

      const found = await repo.findById(circleSessionId("s1"));
      expect(found).toBeNull();
    });
  });

  describe("Membership", () => {
    test("addMembership で追加したメンバーを listMemberships で取得できる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionOwner,
      );

      const memberships = await repo.listMemberships(circleSessionId("s1"));
      expect(memberships).toHaveLength(1);
      expect(memberships[0].userId).toBe(userId("u1"));
      expect(memberships[0].role).toBe(CircleSessionRole.CircleSessionOwner);
    });

    test("同一ユーザーの重複追加は ConflictError になる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );

      await expect(
        repo.addMembership(
          circleSessionId("s1"),
          userId("u1"),
          CircleSessionRole.CircleSessionMember,
        ),
      ).rejects.toThrow(ConflictError);
    });

    test("論理削除済みユーザーを再追加できる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );
      await repo.removeMembership(
        circleSessionId("s1"),
        userId("u1"),
        new Date(),
      );

      // 再追加は成功するべき（部分ユニークインデックスの振る舞い）
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionOwner,
      );

      const memberships = await repo.listMemberships(circleSessionId("s1"));
      expect(memberships).toHaveLength(1);
      expect(memberships[0].role).toBe(CircleSessionRole.CircleSessionOwner);
    });

    test("updateMembershipRole でロールを変更できる", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );
      await repo.updateMembershipRole(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionManager,
      );

      const memberships = await repo.listMemberships(circleSessionId("s1"));
      expect(memberships[0].role).toBe(CircleSessionRole.CircleSessionManager);
    });

    test("存在しないメンバーのロール変更は NotFoundError になる", async () => {
      const repo = makeRepo();
      await expect(
        repo.updateMembershipRole(
          circleSessionId("s1"),
          userId("u1"),
          CircleSessionRole.CircleSessionManager,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    test("removeMembership で論理削除される", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );
      await repo.removeMembership(
        circleSessionId("s1"),
        userId("u1"),
        new Date(),
      );

      const memberships = await repo.listMemberships(circleSessionId("s1"));
      expect(memberships).toHaveLength(0);
    });

    test("areUsersSessionMembers は全員参加なら true を返す", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u2"),
        CircleSessionRole.CircleSessionMember,
      );

      const result = await repo.areUsersSessionMembers(circleSessionId("s1"), [
        userId("u1"),
        userId("u2"),
      ]);
      expect(result).toBe(true);
    });

    test("areUsersSessionMembers は一人でも不参加なら false を返す", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );

      const result = await repo.areUsersSessionMembers(circleSessionId("s1"), [
        userId("u1"),
        userId("u2"),
      ]);
      expect(result).toBe(false);
    });

    test("areUsersSessionMembers は空配列なら false を返す", async () => {
      const repo = makeRepo();
      const result = await repo.areUsersSessionMembers(
        circleSessionId("s1"),
        [],
      );
      expect(result).toBe(false);
    });

    test("areUsersSessionMembers は論理削除済みメンバーを除外する", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );
      await repo.removeMembership(
        circleSessionId("s1"),
        userId("u1"),
        new Date(),
      );

      const result = await repo.areUsersSessionMembers(circleSessionId("s1"), [
        userId("u1"),
      ]);
      expect(result).toBe(false);
    });

    test("listMembershipsByUserId はユーザーの全メンバーシップを返す", async () => {
      const repo = makeRepo();
      await repo.addMembership(
        circleSessionId("s1"),
        userId("u1"),
        CircleSessionRole.CircleSessionMember,
      );
      await repo.addMembership(
        circleSessionId("s2"),
        userId("u1"),
        CircleSessionRole.CircleSessionOwner,
      );

      const result = await repo.listMembershipsByUserId(userId("u1"));
      expect(result).toHaveLength(2);
    });

    test("存在しないメンバーの removeMembership は NotFoundError になる", async () => {
      const repo = makeRepo();
      await expect(
        repo.removeMembership(circleSessionId("s1"), userId("u1"), new Date()),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
