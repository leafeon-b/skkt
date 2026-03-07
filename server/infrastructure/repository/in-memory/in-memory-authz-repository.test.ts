import { describe, expect, test } from "vitest";
import { createInMemoryAuthzRepository } from "./in-memory-authz-repository";
import { createInMemoryUserRepository } from "./in-memory-user-repository";
import { createInMemoryCircleRepository } from "./in-memory-circle-repository";
import { createInMemoryCircleSessionRepository } from "./in-memory-circle-session-repository";
import { createUser } from "@/server/domain/models/user/user";
import { toCircleId, toCircleSessionId, toUserId } from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";

describe("InMemoryAuthzRepository", () => {
  const makeRepos = () => {
    const userRepo = createInMemoryUserRepository();
    const circleRepo = createInMemoryCircleRepository();
    const sessionRepo = createInMemoryCircleSessionRepository();
    const authzRepo = createInMemoryAuthzRepository({
      userStore: userRepo._store,
      circleMembershipStore: circleRepo._membershipStore,
      circleSessionMembershipStore: sessionRepo._membershipStore,
    });
    return { userRepo, circleRepo, sessionRepo, authzRepo };
  };

  describe("isRegisteredUser", () => {
    test("登録済みユーザーは true を返す", async () => {
      const { userRepo, authzRepo } = makeRepos();
      const user = createUser({ id: toUserId("u1"), name: "Alice" });
      await userRepo.save(user);

      expect(await authzRepo.isRegisteredUser("u1")).toBe(true);
    });

    test("未登録ユーザーは false を返す", async () => {
      const { authzRepo } = makeRepos();
      expect(await authzRepo.isRegisteredUser("not-exist")).toBe(false);
    });
  });

  describe("findCircleMembership", () => {
    test("アクティブなメンバーのロールを返す", async () => {
      const { circleRepo, authzRepo } = makeRepos();
      await circleRepo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleOwner,
      );

      const status = await authzRepo.findCircleMembership("u1", "c1");
      expect(status).toEqual({
        kind: "member",
        role: CircleRole.CircleOwner,
      });
    });

    test("メンバーでないユーザーは none を返す", async () => {
      const { authzRepo } = makeRepos();
      const status = await authzRepo.findCircleMembership("u1", "c1");
      expect(status).toEqual({ kind: "none" });
    });

    test("論理削除済みメンバーは none を返す", async () => {
      const { circleRepo, authzRepo } = makeRepos();
      await circleRepo.addMembership(
        toCircleId("c1"),
        toUserId("u1"),
        CircleRole.CircleMember,
      );
      await circleRepo.removeMembership(
        toCircleId("c1"),
        toUserId("u1"),
        new Date(),
      );

      const status = await authzRepo.findCircleMembership("u1", "c1");
      expect(status).toEqual({ kind: "none" });
    });
  });

  describe("findCircleSessionMembership", () => {
    test("アクティブなメンバーのロールを返す", async () => {
      const { sessionRepo, authzRepo } = makeRepos();
      await sessionRepo.addMembership(
        toCircleSessionId("s1"),
        toUserId("u1"),
        CircleSessionRole.CircleSessionOwner,
      );

      const status = await authzRepo.findCircleSessionMembership("u1", "s1");
      expect(status).toEqual({
        kind: "member",
        role: CircleSessionRole.CircleSessionOwner,
      });
    });

    test("メンバーでないユーザーは none を返す", async () => {
      const { authzRepo } = makeRepos();
      const status = await authzRepo.findCircleSessionMembership("u1", "s1");
      expect(status).toEqual({ kind: "none" });
    });

    test("論理削除済みメンバーは none を返す", async () => {
      const { sessionRepo, authzRepo } = makeRepos();
      await sessionRepo.addMembership(
        toCircleSessionId("s1"),
        toUserId("u1"),
        CircleSessionRole.CircleSessionMember,
      );
      await sessionRepo.removeMembership(
        toCircleSessionId("s1"),
        toUserId("u1"),
        new Date(),
      );

      const status = await authzRepo.findCircleSessionMembership("u1", "s1");
      expect(status).toEqual({ kind: "none" });
    });
  });
});
